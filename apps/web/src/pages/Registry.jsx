import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { recentMonths } from '../constants/time'
import { useToast } from '../context/ToastContext'
import { useFinance } from '../context/FinanceContext'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import ConfirmModal from '../components/molecules/ConfirmModal'
import OCRScanner from '../components/organisms/OCRScanner'

const MESES = recentMonths(12)
const fmt = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

const isAuto = (item) => item.source && (item.source.startsWith('BA:') || item.source.startsWith('BB:'))
const sourceLabel = (source) => {
  if (!source) return null
  if (source.startsWith('BA:')) return { label: '🏪 Supermarket', variant: 'info' }
  if (source.startsWith('BB:')) return { label: '🥩 Market', variant: 'success' }
  return null
}

const BLANK = { 
    name: '', 
    category_id: '', 
    channel_id: '', 
    unit_id: '', 
    quantity: 1, 
    unit_price: 0, 
    prev_month_price: '', 
    status: 'Planned' 
}

export default function Registro() {
  const { addToast } = useToast()
  const { categories, channels, units, loaded: taxonomiesLoaded } = useFinance()
  
  const [month, setMonth] = useState(MESES[0])
  const [items, setItems] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmData, setConfirmData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, anlRes] = await Promise.all([
        api.get(`/expenses/?month=${month}`),
        api.get(`/analysis/${month}`).catch(() => ({ data: null })),
      ])
      setItems(itemsRes.data)
      setAnalysis(anlRes.data)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  // Initialize form with defaults when taxonomies load
  useEffect(() => {
    if (taxonomiesLoaded && !editId) {
      setForm(f => ({
        ...f,
        category_id: categories[0]?.id || '',
        channel_id: channels.find(c => c.name === 'Cash')?.id || channels[0]?.id || '',
        unit_id: units.find(u => u.name === 'un')?.id || units[0]?.id || ''
      }))
    }
  }, [taxonomiesLoaded, categories, channels, units, editId])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    const payload = {
      ...form,
      month,
      category_id: parseInt(form.category_id) || null,
      channel_id: parseInt(form.channel_id) || null,
      unit_id: parseInt(form.unit_id) || null,
      unit_price: parseFloat(form.unit_price) || 0,
      quantity: parseFloat(form.quantity) || 1,
      prev_month_price: form.prev_month_price ? parseFloat(form.prev_month_price) : null,
    }
    
    try {
      if (editId) {
        await api.put(`/expenses/${editId}`, payload)
        addToast('Record updated successfully', 'success')
      } else {
        await api.post('/expenses/', payload)
        addToast('Purchase registered successfully', 'success')
      }
      setEditId(null)
      const lastChannel = form.channel_id
      const lastUnit = form.unit_id
      setForm({
          ...BLANK,
          category_id: categories[0]?.id || '',
          channel_id: lastChannel,
          unit_id: lastUnit
      })
      fetchData()
    } catch (err) {
      addToast('Error saving record', 'danger')
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setForm({ 
        ...item, 
        category_id: item.category_id || '',
        channel_id: item.channel_id || '',
        unit_id: item.unit_id || '',
        prev_month_price: item.prev_month_price || '' 
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    addToast(`Editing: ${item.name}`, 'info')
  }

  const handleDeleteConfirm = async () => {
    const item = confirmData.item
    setConfirmData(null)
    try {
      await api.delete(`/expenses/${item.id}`)
      addToast('Record permanently deleted', 'success')
      fetchData()
    } catch (e) {
      addToast('Error deleting record', 'danger')
      fetchData()
    }
  }

  const handleStatus = async (item) => {
    if (isAuto(item)) return
    const newStatus = item.status === 'Bought' ? 'Planned' : 'Bought'
    try {
      await api.put(`/expenses/${item.id}`, { ...item, status: newStatus })
      addToast(`Status updated: ${newStatus}`, 'success')
      fetchData()
    } catch (err) {
      addToast('Error updating status', 'danger')
    }
  }

  const filtered = useMemo(() => items.filter(i => {
    const itemName = i.name || ''
    const catName = i.category_name || ''
    const matchesSearch = itemName.toLowerCase().includes(search.toLowerCase()) || 
                         (catName.toLowerCase().includes(search.toLowerCase()))
    if (!matchesSearch) return false
    if (filter === 'bought') return i.status === 'Bought'
    if (filter === 'planned') return i.status !== 'Bought'
    if (filter === 'auto') return isAuto(i)
    if (filter === 'manual') return !isAuto(i)
    return true
  }), [items, filter, search])

  const totalBought = items.filter(i => i.status === 'Bought').reduce((s, i) => s + (i.subtotal || 0), 0)

  // Options mapping
  const catOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories])
  const canalOptions = useMemo(() => channels.map(c => ({ value: c.id, label: c.name })), [channels])
  const unitOptions = useMemo(() => units.map(u => ({ value: u.id, label: u.name })), [units])
  const statusOptions = [
    { value: 'Planned', label: 'Planned' },
    { value: 'Bought', label: 'Bought' }
  ]

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProcessing(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await api.post('/ocr/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setOcrResult(data.items)
      addToast('Invoice analyzed by AI', 'success')
    } catch (err) {
      addToast('Error analyzing image with AI', 'danger')
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkIngest = async () => {
    if (!ocrResult?.length) return
    setProcessing(true)
    try {
      const payload = ocrResult.map(it => ({
        ...it,
        month,
        category_id: categories[0]?.id || null,
        channel_id: channels.find(c => c.name === 'Cash')?.id || channels[0]?.id || null,
        unit_id: units.find(u => u.name === 'un')?.id || units[0]?.id || null,
        source: 'OCR'
      }))
      await api.post('/ocr/ingest', payload)
      addToast(`${ocrResult.length} items incorporated into flow`, 'success')
      setScanning(false)
      setOcrResult(null)
      fetchData()
    } catch (err) {
      addToast('Error in bulk ingestion', 'danger')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="page-entry space-y-10 pb-20">
      {confirmData && (
        <ConfirmModal
          mensaje={confirmData.autoBlock
            ? `This item comes from ${sourceLabel(confirmData.item.source)?.label}. You must delete it from its original list.`
            : `Permanently delete "${confirmData.item.name}"?`}
          onConfirm={confirmData.autoBlock ? () => setConfirmData(null) : handleDeleteConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

      <PageHeader
        title={<>Shopping <span className="text-accent italic font-light">Center</span></>}
        subtitle="Full control of inventory and consumption flows"
        icon="🛒"
        badge="Operational V4.5 Enterprise"
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={() => setScanning(true)}>
              📸 Scan
            </Button>
            <div className="glass p-1 rounded-xl">
              <select
                value={month} onChange={e => setMonth(e.target.value)}
                className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
              >
                {MESES.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
              </select>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card interactive className="p-6 border-t-2 border-success/20">
            <Badge variant="success" glow className="mb-2">Total Investment</Badge>
            <div className="text-3xl font-black text-success tabular-nums">{fmt(totalBought)}</div>
        </Card>
        <Card interactive className="p-6 border-t-2 border-accent/20">
            <Badge variant="muted" className="mb-2">Inventory Items</Badge>
            <div className="text-3xl font-black text-tx-primary tabular-nums">{items.length}</div>
        </Card>
        <Card interactive className="p-6 border-t-2 border-info/20">
            <Badge variant="info" glow className="mb-2">Projected Balance</Badge>
            <div className="text-3xl font-black text-info tabular-nums">{fmt(analysis?.kpis?.cash_balance || 0)}</div>
        </Card>
      </div>

      <Card className={`p-8 border border-border-base shadow-premium transition-all duration-500 ${editId ? 'glow-accent' : ''}`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-sm font-black text-tx-primary tracking-[0.3em] uppercase">
            {editId ? '✏️ Module Update' : '🚀 Supplies Ingestion'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-2">
            <Input label="Product" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g.: Whole Milk" />
          </div>
          <Select label="Category" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} options={catOptions} />
          <Select label="Channel" value={form.channel_id} onChange={e => setForm({ ...form, channel_id: e.target.value })} options={canalOptions} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Quantity" type="number" step="0.1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Select label="Unit" value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} options={unitOptions} />
          </div>
          <Input label="Unit Price ($)" type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} className="text-success font-black" />
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={statusOptions} />

          <div className="md:col-span-6 mt-4">
            <Button className="w-full py-5" onClick={handleSubmit}>
              {editId ? 'Confirm Changes' : 'Enter into Record'}
            </Button>
            {editId && (
              <Button variant="ghost" className="w-full mt-2" onClick={() => { setEditId(null); setForm(BLANK); }}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-base flex flex-col lg:flex-row justify-between items-center gap-6 bg-tx-primary/[0.01]">
          <div className="flex flex-col gap-1 w-full lg:w-auto">
            <h3 className="text-[11px] font-black text-tx-primary uppercase tracking-[0.25em]">Financial Flow History</h3>
            <Input placeholder="🔍 Filter records..." value={search} onChange={e => setSearch(e.target.value)} className="py-2.5 px-4 h-auto text-xs w-full lg:w-64" />
          </div>
          <div className="flex bg-tx-primary/5 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'all', label: '🌍 View All' },
              { id: 'bought', label: 'Bought' },
              { id: 'planned', label: 'Planned' },
              { id: 'auto', label: 'Auto' },
              { id: 'manual', label: 'Manual' }
            ].map(f => (
              <button
                key={f.id} onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${filter === f.id ? 'bg-accent text-white shadow-lg glow-accent' : 'text-tx-secondary hover:bg-tx-primary/5'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-widest text-tx-muted bg-tx-primary/[0.01]">
                <th className="p-5 pl-8 w-12 text-center">ST</th>
                <th className="p-5">Detail</th>
                <th className="p-5 hidden md:table-cell">Category</th>
                <th className="p-5 text-right w-24">Qty</th>
                <th className="p-5 hidden md:table-cell text-right">Unit Price</th>
                <th className="p-5 text-right pr-8">Subtotal</th>
                <th className="p-5 w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filtered.map(item => {
                const auto = isAuto(item)
                const source = sourceLabel(item.source)
                const isBought = item.status === 'Bought'
                return (
                   <tr key={item.id} className={`hover:bg-tx-primary/[0.02] transition-colors group ${isBought ? '' : 'opacity-60'} ${auto ? 'bg-accent/[0.02]' : ''}`}>
                    <td className="p-4 pl-8 text-center">
                      <button
                        onClick={() => handleStatus(item)} disabled={auto}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] border transition-all ${isBought ? 'bg-success/20 border-success/30 text-success glow-success' : 'bg-tx-primary/5 border-border-base grayscale'}`}
                      >
                        {isBought ? '✓' : '—'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-tx-primary leading-tight">{item.name}</span>
                        {source && <Badge variant={source.variant} className="mt-1 w-fit">{source.label}</Badge>}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="muted">{item.category_name}</Badge>
                    </td>
                    <td className="p-4 text-right tabular-nums text-sm font-bold text-tx-secondary">{item.quantity} <span className="text-[10px] opacity-40 ml-1 uppercase">{item.unit_name}</span></td>
                    <td className="p-4 hidden md:table-cell text-right tabular-nums text-sm font-bold text-tx-muted">{fmt(item.unit_price)}</td>
                    <td className="p-4 text-right pr-8 tabular-nums text-sm font-black text-success leading-none">{fmt(item.subtotal)}</td>
                    <td className="p-4 text-right pr-8">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        {!auto && <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>✏️</Button>}
                        {!auto && <Button variant="outline" size="sm" className="hover:!text-danger" onClick={() => setConfirmData({ item })}>🗑️</Button>}
                        {auto && <Link to={item.source?.startsWith('BA:') ? '/bloque-a' : '/bloque-b'}><Button variant="outline" size="sm">🔗</Button></Link>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filtered.length && <div className="p-20 text-center text-tx-muted font-bold opacity-30 italic text-sm">End of data flow in this spectrum</div>}
        </div>
      </Card>

      {scanning && (
        <OCRScanner
          onClose={() => setScanning(false)}
          processing={processing}
          ocrResult={ocrResult}
          handleFileUpload={handleFileUpload}
          handleBulkIngest={handleBulkIngest}
          onReset={() => setOcrResult(null)}
          fmt={fmt}
        />
      )}
    </div>
  )
}
