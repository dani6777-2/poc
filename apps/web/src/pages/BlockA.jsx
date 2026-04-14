import { useState, useEffect, useCallback, useMemo } from 'react'
import { expenseService } from '../services'
import { recentMonths } from '../constants/time'
import { useFinance } from '../context/FinanceContext'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import { useToast } from '../context/ToastContext'

const RECENT_MONTHS = recentMonths(12)
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const emptyForm = (month, category_id) => ({
  month, category_id: category_id || '', name: '', unit_id: '', quantity: '', channel_id: '', unit_price: '', prev_month_price: ''
})

export default function BlockA() {
  const { sections, categories, channels, units, loaded: taxonomiesLoaded } = useFinance()
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [items, setItems]   = useState([])
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(emptyForm(RECENT_MONTHS[0], ''))
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await expenseService.getInventoryBlock('block-a', { month })
      setItems(data)
    } catch (e) {
      addToast('Error connecting to inventory vault', 'error')
    } finally {
      setLoading(false)
    }
  }, [month, addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = (catId = null) => {
    const defaultCatId = catId || categories[0]?.id || ''
    setForm(emptyForm(month, defaultCatId))
    setEditing(null)
    setModal(true)
  }

  const openEdit = (item) => {
    setForm({ ...item })
    setEditing(item.id)
    setModal(true)
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = {
      ...form,
      category_id: parseInt(form.category_id),
      unit_id: parseInt(form.unit_id) || null,
      channel_id: parseInt(form.channel_id) || null,
      quantity: parseFloat(form.quantity) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
      prev_month_price: form.prev_month_price ? parseFloat(form.prev_month_price) : null
    }

    try {
      if (editing) {
        await expenseService.updateInventoryItem('block-a', editing, payload)
        addToast('Registry updated in the matrix', 'success')
      } else {
        await expenseService.createInventoryItem('block-a', payload)
        addToast('New asset registered in Block A', 'success')
      }
      setModal(false)
      fetchData()
    } catch (e) {
      addToast('Failure in data persistence', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Confirm de-listing of this asset?')) return
    try {
      await expenseService.deleteInventoryItem('block-a', id)
      addToast('Asset removed from inventory', 'warning')
      fetchData()
    } catch (e) {
      addToast('Error processing deletion', 'error')
    }
  }

  const subtotalValue = useMemo(() => 
    (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0), 
    [form.quantity, form.unit_price]
  )
  
  const totalGeneral = useMemo(() => 
    items.reduce((s, i) => s + (i.subtotal || 0), 0), 
    [items]
  )

  // Group items by Section for rendering (using joined section_name)
  const sectionsWithItems = useMemo(() => {
    const groups = {}
    items.forEach(item => {
        const secName = item.section_name || 'Various'
        if (!groups[secName]) groups[secName] = []
        groups[secName].push(item)
    })
    return groups
  }, [items])

  const sortedSecNames = useMemo(() => {
    const names = Object.keys(sectionsWithItems)
    // Sort by taxonomy sort_order if available
    return names.sort((a, b) => {
        const sa = sections.find(s => s.name === a)?.sort_order || 99
        const sb = sections.find(s => s.name === b)?.sort_order || 99
        return sa - sb
    })
  }, [sectionsWithItems, sections])

  const catOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories])
  const canalOptions = useMemo(() => channels.map(c => ({ value: c.id, label: c.name })), [channels])
  const unitOptions = useMemo(() => units.map(u => ({ value: u.id, label: u.name })), [units])

  return (
    <div className="page-entry pb-20 space-y-10">
      <PageHeader 
        title={<>Inventory <span className="text-accent italic font-light">Block A</span></>}
        subtitle="Critical management of pantry, groceries, and mass consumption stock"
        icon="🏪"
        badge={`Master Inventory ${month} Active`}
        actions={
          <div className="flex items-center gap-3">
            <div className="glass p-1 rounded-xl">
              <select 
                value={month} 
                onChange={e => setMonth(e.target.value)}
                className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
              >
                {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
              </select>
            </div>
            <Button onClick={() => openNew()} variant="accent" size="sm" className="px-6 font-black uppercase tracking-widest h-11">
              + Add Asset
            </Button>
          </div>
        }
      />

      {/* Global Summary Card */}
      <Card border={false} className="p-10 shadow-2xl relative overflow-hidden group bg-linear-to-r from-accent/10 to-transparent">
         <div className="absolute right-0 top-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
         
         <div className="relative flex flex-col md:flex-row md:items-center gap-12">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">Operating Expense Matrix</label>
               <div className="text-5xl font-black text-tx-primary tabular-nums tracking-tighter transition-transform group-hover:scale-[1.01] origin-left drop-shadow-sm">{fmt(totalGeneral)}</div>
            </div>
            
            <div className="h-16 w-px bg-border-base hidden md:block" />
            
            <div className="space-y-1">
               <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">SKU Asset Diversity</label>
               <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-tx-secondary tabular-nums tracking-tighter">{items.length}</div>
                  <Badge variant="muted" className="tracking-widest opacity-60">REGISTERED UNITS</Badge>
               </div>
            </div>
         </div>
      </Card>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
           <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Synchronizing Block A vaults...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedSecNames.map(secName => {
            const secItems = sectionsWithItems[secName]
            const secTotal = secItems.reduce((s, i) => s + (i.subtotal || 0), 0)
            return (
              <section key={secName} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-4">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-accent rounded-full shadow-glow-accent" />
                      <h3 className="text-[13px] font-black text-tx-primary uppercase tracking-[0.3em]">{secName}</h3>
                   </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                         <div className="text-[9px] font-black text-tx-muted uppercase tracking-widest opacity-30 leading-none mb-1">Segment Total</div>
                         <span className="text-sm font-black text-tx-primary tabular-nums">{fmt(secTotal)}</span>
                       </div>
                   </div>
                </div>

                <Card className="overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[9px] font-black uppercase text-tx-muted/30 tracking-[0.3em] border-b border-border-base bg-tx-primary/[0.02]">
                                    <th className="p-6 pl-10">Asset / SKU Descriptor</th>
                                    <th className="p-6 text-center w-24">Category</th>
                                    <th className="p-6 text-center w-24">Unit</th>
                                    <th className="p-6 text-center w-24">Load</th>
                                    <th className="p-6 w-32">Channel/Source</th>
                                    <th className="p-6 text-right w-36">Entry Price</th>
                                    <th className="p-6 text-right w-36">Matrix Value</th>
                                    <th className="p-6 text-center w-32">Volatility</th>
                                    <th className="p-6 pr-10 text-right w-24">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-base">
                                {secItems.map(item => {
                                    const diff = item.prev_month_price ? (item.unit_price - item.prev_month_price) : null
                                    return (
                                        <tr key={item.id} className="hover:bg-tx-primary/[0.01] transition-colors group">
                                            <td className="p-6 pl-10">
                                                <div className="text-xs font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-widest leading-none mb-1">{item.name}</div>
                                                <div className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30">ID_REF: {item.id.toString(16).toUpperCase()}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <Badge variant="muted" size="sm" className="font-black px-3">{item.category_name}</Badge>
                                            </td>
                                            <td className="p-6 text-center">
                                                <Badge variant="muted" size="sm" className="font-black px-3">{item.unit_name || 'N/A'}</Badge>
                                            </td>
                                            <td className="p-6 text-center font-black tabular-nums text-sm">{item.quantity || '0'}</td>
                                            <td className="p-6">
                                                <span className="text-[10px] font-bold text-tx-muted uppercase truncate block opacity-60">{item.channel_name || 'DIRECT_FEED'}</span>
                                            </td>
                                            <td className="p-6 text-right font-black tabular-nums text-sm text-tx-secondary">{item.unit_price ? fmt(item.unit_price) : '—'}</td>
                                            <td className="p-6 text-right font-black tabular-nums text-base text-tx-primary drop-shadow-glow-muted">{fmt(item.subtotal)}</td>
                                            <td className="p-6 text-center">
                                                {item.prev_month_price ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[9px] font-black text-tx-muted opacity-20">{fmt(item.prev_month_price)}</span>
                                                        {diff !== null && (
                                                            <div className={`text-[10px] font-black flex items-center gap-1 ${diff > 0 ? 'text-danger' : 'text-success'}`}>
                                                                {diff > 0 ? '▲' : '▼'} {fmt(Math.abs(diff))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <Badge variant="accent" size="sm" className="scale-75 opacity-30">NEW_NODE</Badge>}
                                            </td>
                                            <td className="p-6 text-right pr-10">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="w-9 h-9 p-0 rounded-lg hover:bg-accent/10 hover:text-accent">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="w-9 h-9 p-0 rounded-lg hover:bg-danger/10 hover:text-danger">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot className="bg-tx-primary/[0.04] text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted/50 border-t border-border-base">
                                <tr>
                                    <td className="p-6 pl-10" colSpan={6}>Aggregate Segment Contribution</td>
                                    <td className="p-6 text-right text-tx-primary text-base tracking-tighter drop-shadow-glow-muted">{fmt(secTotal)}</td>
                                    <td colSpan={2} />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
              </section>
            )
          })}
          {items.length === 0 && (
             <Card border={false} className="py-40 flex flex-col items-center justify-center text-center opacity-20 bg-tx-primary/[0.01]">
                <span className="text-6xl mb-6">📦</span>
                <p className="text-xs font-black uppercase tracking-[0.5em]">Block A vault is empty</p>
             </Card>
          )}
        </div>
      )}

      {/* Modal Integration */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl" onClick={() => setModal(false)} />
          <Card className="w-full max-w-2xl p-10 md:p-14 relative z-10 animate-in zoom-in-95 duration-500 rounded-[3rem]">
            <div className="flex items-center justify-between mb-12">
               <div className="space-y-1">
                  <h2 className="text-3xl font-black text-tx-primary uppercase tracking-tighter leading-none">{editing ? 'Edit Matrix Entry' : 'Manual Asset Registry'}</h2>
                  <Badge variant="accent" className="tracking-[0.4em] opacity-80">INVENTORY_PROTOCOL_A</Badge>
               </div>
               <Button variant="ghost" className="w-12 h-12 p-0 rounded-2xl text-tx-muted hover:text-tx-primary" onClick={() => setModal(false)}>✕</Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Asset Descriptor / SKU</label>
                  <Input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Premium Basmati Evolution" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Category</label>
                  <Select name="category_id" value={form.category_id} onChange={handleChange} options={catOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Acquisition Channel</label>
                  <Select name="channel_id" value={form.channel_id} onChange={handleChange} options={canalOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Unit</label>
                  <Select name="unit_id" value={form.unit_id} onChange={handleChange} options={unitOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Load Quota (Quantity)</label>
                  <Input name="quantity" type="number" step="0.01" value={form.quantity} onChange={handleChange} className="font-black tabular-nums" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Entry Price ($)</label>
                  <Input name="unit_price" type="number" value={form.unit_price} onChange={handleChange} className="font-black tabular-nums" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Previous Reference ($)</label>
                  <Input name="prev_month_price" type="number" value={form.prev_month_price} onChange={handleChange} className="font-black tabular-nums opacity-60" />
                </div>
              </div>

              {subtotalValue > 0 && (
                <Card border={false} className="p-8 bg-success/5 border border-success/20 flex items-center justify-between rounded-3xl">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-success uppercase tracking-[0.3em] leading-none">Calculated Investment</label>
                  </div>
                  <div className="text-3xl font-black text-tx-primary tabular-nums drop-shadow-glow-accent">{fmt(subtotalValue)}</div>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-5 mt-14">
                <Button type="submit" variant="accent" className="flex-1 py-7 uppercase tracking-[0.3em]">
                  {editing ? 'Update Architecture' : 'Commit New Asset'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setModal(false)} className="px-12 py-7 uppercase tracking-[0.2em] border border-border-base">
                  Dismiss
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
