import { useState, useEffect, useCallback, useMemo } from 'react'
import { expenseService } from '../services'
import { RECENT_MONTHS } from '../constants/time'
import { INVENTORY_BLOCK_B_DEFAULT } from '../constants/forms'
import { fmt } from '../utils/formatters'
import { useFinance } from '../context/FinanceContext'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import { useToast } from '../context/ToastContext'

export default function BlockB() {
  const { sections, categories, channels, units, loaded: taxonomiesLoaded } = useFinance()
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [items, setItems]   = useState([])
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(INVENTORY_BLOCK_B_DEFAULT(RECENT_MONTHS[0], ''))
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await expenseService.getInventoryBlock('block-b', { month })
      setItems(data)
    } catch (e) {
      addToast('Error connecting to perishable vault', 'error')
    } finally {
      setLoading(false)
    }
  }, [month, addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = (catId = null) => {
    const defaultCatId = catId || categories.find(c => c.name === 'Market/Produce')?.id || categories[0]?.id || ''
    setForm(INVENTORY_BLOCK_B_DEFAULT(month, defaultCatId))
    setEditing(null)
    setModal(true)
  }

  const openEdit = (item) => {
    setForm({ ...item, prev_month_price: item.prev_month_price || '' })
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
      channel_id: parseInt(form.channel_id) || null,
      unit_id: parseInt(form.unit_id) || null,
      price_per_kg: parseFloat(form.price_per_kg) || 0,
      prev_month_price: form.prev_month_price ? parseFloat(form.prev_month_price) : null
    }

    try {
      if (editing) {
        await expenseService.updateInventoryItem('block-b', editing, payload)
        addToast('Registry optimization completed', 'success')
      } else {
        await expenseService.createInventoryItem('block-b', payload)
        addToast('New perishable asset registered', 'success')
      }
      setModal(false)
      fetchData()
    } catch (e) {
      addToast('Error in Block B persistence', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Confirm de-listing of this asset?')) return
    try {
      await expenseService.deleteInventoryItem('block-b', id)
      addToast('Asset removed from market matrix', 'warning')
      fetchData()
    } catch (e) {
      addToast('Error processing deletion', 'error')
    }
  }

  const totalSubtotal = useMemo(() => items.reduce((s, i) => s + (i.subtotal || 0), 0), [items])

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
        title={<>Inventory <span className="text-accent italic font-light">Block B</span></>}
        subtitle="Fresh produce, proteins, and weekly market management"
        icon="🍎"
        badge={`Fresh Inventory ${month} Active`}
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
            <Button onClick={() => openNew()} variant="success" size="sm" className="px-6 font-black uppercase tracking-widest h-11 text-primary">
              + Add Item
            </Button>
          </div>
        }
      />

      <Card border={false} className="p-10 shadow-2xl relative overflow-hidden group bg-linear-to-r from-success/10 to-transparent">
         <div className="absolute left-0 top-0 w-96 h-96 bg-success/5 rounded-full blur-[120px] -ml-40 -mt-40 pointer-events-none" />
         
         <div className="relative flex flex-col md:flex-row md:items-center gap-12">
           <div className="space-y-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">Fresh Produce Expense</label>
              <div className="text-5xl font-black text-tx-primary tabular-nums tracking-tighter transition-transform group-hover:scale-[1.01] origin-left drop-shadow-sm">{fmt(totalSubtotal)}</div>
           </div>
           
           <div className="h-16 w-px bg-border-base hidden md:block" />
           
           <div className="space-y-1">
               <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">Perishable Diversity</label>
               <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-tx-secondary tabular-nums tracking-tighter">{items.length}</div>
                  <Badge variant="muted" className="tracking-widest opacity-60">REG. UNITS</Badge>
               </div>
           </div>
         </div>
      </Card>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
           <div className="w-10 h-10 border-4 border-success/10 border-t-success rounded-full animate-spin" />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Analyzing perishable price deltas...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {sortedSecNames.map(secName => {
            const secItems = sectionsWithItems[secName]
            const secTotal = secItems.reduce((s, i) => s + (i.subtotal || 0), 0)
            const secIcon = sections.find(s => s.name === secName)?.icon || '🥦'
            return (
              <section key={secName} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-4">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-success rounded-full shadow-glow-success" />
                      <h3 className="text-[13px] font-black text-tx-primary uppercase tracking-[0.3em] flex items-center gap-3">
                         <span className="opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">{secIcon}</span>
                         {secName}
                      </h3>
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
                          <th className="p-6 pl-10">Produce / Species</th>
                          <th className="p-6 text-center w-24">Category</th>
                          <th className="p-6 text-center w-24">Unit</th>
                          <th className="p-6 w-32">Origin/Channel</th>
                          <th className="p-6 text-right w-36">Unit Price</th>
                          <th className="p-6 text-right w-36">Subtotal</th>
                          <th className="p-6 text-center w-32">Price Delta</th>
                          <th className="p-6 pr-10 text-right w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base">
                        {secItems.map(item => {
                          const delta = item.delta_precio || 0
                          const hasDelta = item.prev_month_price && item.prev_month_price > 0
                          return (
                            <tr key={item.id} className="hover:bg-tx-primary/[0.01] transition-colors group">
                              <td className="p-6 pl-10">
                                 <div className="text-xs font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-widest leading-none mb-1">{item.name}</div>
                                 <div className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30">BATCH_ID: {item.id.toString(16).toUpperCase()}</div>
                              </td>
                              <td className="p-6 text-center">
                                 <Badge variant="muted" size="sm" className="font-black px-3">{item.category_name}</Badge>
                              </td>
                              <td className="p-6 text-center">
                                 <Badge variant="muted" size="sm" className="font-black px-3">{item.unit_name || 'Kg'}</Badge>
                              </td>
                              <td className="p-6">
                                 <span className="text-[10px] font-bold text-tx-muted uppercase truncate block opacity-60">{item.channel_name || 'PUBLIC_MARKET'}</span>
                              </td>
                              <td className="p-6 text-right font-black tabular-nums text-sm text-tx-primary">{fmt(item.price_per_kg)}</td>
                              <td className="p-6 text-right font-black tabular-nums text-sm text-tx-primary">{fmt(item.subtotal)}</td>
                              <td className="p-6 text-center">
                                {hasDelta ? (
                                  <Badge variant={delta > 0 ? 'danger' : delta < 0 ? 'success' : 'muted'} className="px-4 tracking-tighter">
                                     {delta > 0 ? '▲ INC' : delta < 0 ? '▼ DEC' : 'STABLE'} {fmt(Math.abs(delta))}
                                  </Badge>
                                ) : <span className="text-[10px] font-black text-tx-muted opacity-10 uppercase tracking-widest">UNTRACKED</span>}
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
                            <td className="p-6 pl-10" colSpan={5}>Aggregate Market Segment Value</td>
                            <td className="p-6 text-right text-tx-primary text-base tracking-tighter">{fmt(secTotal)}</td>
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
                <span className="text-6xl mb-6">🥗</span>
                <p className="text-xs font-black uppercase tracking-[0.5em]">Block B matrix is empty</p>
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
                  <h2 className="text-3xl font-black text-tx-primary uppercase tracking-tighter leading-none">{editing ? 'Edit Fresh Entry' : 'New Market Ingestion'}</h2>
                  <Badge variant="success" className="tracking-[0.4em] opacity-80 text-primary">PERISHABLE_PROTOCOL_B</Badge>
               </div>
               <Button variant="ghost" className="w-12 h-12 p-0 rounded-2xl text-tx-muted hover:text-tx-primary" onClick={() => setModal(false)}>✕</Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Produce Descriptor / SKU</label>
                  <Input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Avocado Hass Selected" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Category</label>
                  <Select name="category_id" value={form.category_id} onChange={handleChange} options={catOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Market Channel</label>
                  <Select name="channel_id" value={form.channel_id} onChange={handleChange} options={canalOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Unit</label>
                  <Select name="unit_id" value={form.unit_id} onChange={handleChange} options={unitOptions} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Current Market Rate ($)</label>
                  <Input name="price_per_kg" type="number" value={form.price_per_kg} onChange={handleChange} className="font-black tabular-nums" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">Previous Reference ($)</label>
                  <Input name="prev_month_price" type="number" value={form.prev_month_price} onChange={handleChange} className="font-black tabular-nums opacity-60" placeholder="Optional for delta tracking" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 mt-14">
                <Button type="submit" variant="success" className="flex-1 py-7 uppercase tracking-[0.3em] text-primary">
                  {editing ? 'Update Architecture' : 'Register produce'}
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
