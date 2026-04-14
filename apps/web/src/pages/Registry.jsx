import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { expenseService, analysisService, ocrService } from '../services'
import { RECENT_MONTHS } from '../constants/time'
import { fmt } from '../utils/formatters'
import { isAutoExpense, getSourceLabel } from '../utils/finance'
import { REGISTRY_BLANK_STATE, STATUS_OPTIONS, REGISTRY_FILTERS } from '../constants/forms'
import { useToast } from '../context/ToastContext'
import { useFinance } from '../context/FinanceContext'
import { DashboardTemplate } from '../components/templates'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import KpiCard from '../components/molecules/KpiCard'
import RegistryForm from '../components/organisms/RegistryForm'
import RegistryTable from '../components/organisms/RegistryTable'
import ConfirmModal from '../components/molecules/ConfirmModal'
import OCRScanner from '../components/organisms/OCRScanner'

export default function Registry() {
  const { addToast } = useToast()
  const { categories, channels, units, loaded: taxonomiesLoaded } = useFinance()
  
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [items, setItems] = useState([])
  const [form, setForm] = useState(REGISTRY_BLANK_STATE)
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
      const [itemsData, anlData] = await Promise.all([
        expenseService.getExpenses({ month }),
        analysisService.getAnalysis(month).catch(() => null),
      ])
      setItems(itemsData)
      setAnalysis(anlData)
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
        await expenseService.updateExpense(editId, payload)
        addToast('Record updated successfully', 'success')
      } else {
        await expenseService.createExpense(payload)
        addToast('Purchase registered successfully', 'success')
      }
      setEditId(null)
      const lastChannel = form.channel_id
      const lastUnit = form.unit_id
      setForm({
          ...REGISTRY_BLANK_STATE,
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
      await expenseService.deleteExpense(item.id)
      addToast('Record permanently deleted', 'success')
      fetchData()
    } catch (e) {
      addToast('Error deleting record', 'danger')
      fetchData()
    }
  }

  const handleStatus = async (item) => {
    if (isAutoExpense(item)) return
    const newStatus = item.status === 'Bought' ? 'Planned' : 'Bought'
    try {
      await expenseService.updateExpense(item.id, { ...item, status: newStatus })
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
    if (filter === 'auto') return isAutoExpense(i)
    if (filter === 'manual') return !isAutoExpense(i)
    return true
  }), [items, filter, search])

  const totalBought = items.filter(i => i.status === 'Bought').reduce((s, i) => s + (i.subtotal || 0), 0)

  // Options mapping
  const catOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories])
  const canalOptions = useMemo(() => channels.map(c => ({ value: c.id, label: c.name })), [channels])
  const unitOptions = useMemo(() => units.map(u => ({ value: u.id, label: u.name })), [units])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setProcessing(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await ocrService.upload(formData)
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
      await ocrService.ingest(payload)
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
    <DashboardTemplate
      title={<>Shopping <span className="text-accent italic font-light">Center</span></>}
      subtitle="Full control of inventory and consumption flows"
      icon="🛒"
      badge="Operational V4.5 Enterprise"
      loading={loading}
      headerAction={
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={() => setScanning(true)}>
            📸 Scan
          </Button>
          <div className="glass p-1 rounded-xl">
            <select
              value={month} onChange={e => setMonth(e.target.value)}
              className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
            >
              {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
            </select>
          </div>
        </div>
      }
    >
      {confirmData && (
        <ConfirmModal
          message={confirmData.autoBlock
            ? `This item comes from ${sourceLabel(confirmData.item.source)?.label}. You must delete it from its original list.`
            : `Permanently delete "${confirmData.item.name}"?`}
          onConfirm={confirmData.autoBlock ? () => setConfirmData(null) : handleDeleteConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          badge="Total Investment" 
          variant="success" 
          glow 
          value={fmt(totalBought)} 
          className="border-t-2 border-success/20"
        />
        <KpiCard 
          badge="Inventory Items" 
          variant="muted" 
          value={items.length} 
          className="border-t-2 border-accent/20"
        />
        <KpiCard 
          badge="Projected Balance" 
          variant="info" 
          glow 
          value={fmt(analysis?.kpis?.cash_balance || 0)} 
          className="border-t-2 border-info/20"
        />
      </div>

      <RegistryForm 
        editId={editId}
        form={form}
        setForm={setForm}
        catOptions={catOptions}
        canalOptions={canalOptions}
        unitOptions={unitOptions}
        STATUS_OPTIONS={STATUS_OPTIONS}
        handleSubmit={handleSubmit}
        onCancel={() => { setEditId(null); setForm(REGISTRY_BLANK_STATE); }}
      />

      <RegistryTable 
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        REGISTRY_FILTERS={REGISTRY_FILTERS}
        filtered={filtered}
        handleStatus={handleStatus}
        handleEdit={handleEdit}
        setConfirmData={setConfirmData}
        isAutoExpense={isAutoExpense}
        getSourceLabel={getSourceLabel}
        fmt={fmt}
      />

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
    </DashboardTemplate>
  )
}
