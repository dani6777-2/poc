import { useState, useEffect, useRef, useCallback } from 'react'
import { revenueService } from '../services'
import { MONTH_KEYS, MONTH_LABELS } from '../constants/finance'
import { fmt } from '../utils/formatters'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import { useToast } from '../context/ToastContext'

const totalRow = row => MONTH_KEYS.reduce((s, m) => s + (parseFloat(row[m]) || 0), 0)

export default function Revenues() {
  const [year, setYear]         = useState(new Date().getFullYear())
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState({})
  const [modal, setModal]       = useState(false)
  const [newSource, setNewSource] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const saveTimers = useRef({})
  const rowsRef = useRef([])
  const { addToast } = useToast()

  // Sync Ref with state so debounce always sees the latest
  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await revenueService.getRevenues(year)
      setRows(data)
    } catch(e) { 
      console.error(e) 
      addToast('Error connecting to revenue vault', 'danger')
    } finally {
      setLoading(false)
    }
  }, [year, addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCellChange = (id, field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value)
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: numValue } : r))
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id])
    saveTimers.current[id] = setTimeout(() => saveRow(id, field, numValue), 800)
  }

  const saveRow = async (id, field, value) => {
    setSaving(s => ({ ...s, [id]: true }))
    const currentRow = rowsRef.current.find(r => r.id === id)
    if (!currentRow) {
        setSaving(s => ({ ...s, [id]: false }))
        return
    }
    try {
        await revenueService.updateRevenue(id, { [field]: value })
    } catch (e) {
        addToast('Failed to persist revenue entry', 'danger')
    } finally {
        setSaving(s => ({ ...s, [id]: false }))
    }
  }

  const handleAddSource = async () => {
    if (!newSource.trim()) return
    try {
        await revenueService.createRevenue({ year, source: newSource.trim(), sort_order: rows.length })
        addToast('New flow source injected successfully', 'success')
        setNewSource('')
        setModal(false)
        fetchData()
    } catch (e) {
        addToast('Error registering new source', 'danger')
    }
  }

  const handleDeleteConfirm = async () => {
    const id = confirmId
    setConfirmId(null)
    clearTimeout(saveTimers.current[id])
    delete saveTimers.current[id]
    
    setRows(prev => prev.filter(r => r.id !== id))
    try {
      await revenueService.deleteRevenue(id)
      addToast('Revenue source removed from matrix', 'warning')
    } catch (e) {
      addToast('Failed to de-list the source', 'danger')
      fetchData()
    }
  }

  const totalsByMonth = MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalAnnual = totalsByMonth.reduce((a, b) => a + b, 0)

  return (
    <div className="page-entry pb-20 space-y-10 group">
      <PageHeader 
        title={<>Revenue <span className="text-success italic font-light">Streams</span></>}
        subtitle={`CFO Management: Annual revenue planning and audit for cycle ${year}`}
        icon="💰"
        badge={`Fiscal Audit ${year} Active`}
        actions={
          <div className="flex items-center gap-3">
             <div className="glass p-1 rounded-xl flex items-center">
                <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-lg hover:bg-tx-primary/5" onClick={() => setYear(year - 1)}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </Button>
                <span className="px-5 font-black text-tx-primary text-base tabular-nums">{year}</span>
                <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-lg hover:bg-tx-primary/5" onClick={() => setYear(year + 1)}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Button>
             </div>
             <Button onClick={() => setModal(true)} variant="accent" size="sm" className="px-8 font-black uppercase tracking-[0.2em] h-12 shadow-glow-accent">
                + Inject Source
             </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card interactive className="p-8 flex flex-col items-center text-center border-t-2 border-success/30 shadow-premium border-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-success/20" />
          <label className="text-[10px] uppercase font-black tracking-[0.3em] text-tx-muted mb-4 opacity-40">Consolidated Annual Revenue</label>
          <span className="text-4xl font-black text-success drop-shadow-glow-success tabular-nums tracking-tighter">{fmt(totalAnnual)}</span>
          <Badge variant="success" size="sm" className="mt-5 opacity-40 tracking-[0.3em] uppercase font-black text-[9px]">PROJECTED {year}</Badge>
        </Card>

        <Card interactive className="p-8 flex flex-col items-center text-center shadow-premium border-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-tx-primary/5" />
          <label className="text-[10px] uppercase font-black tracking-[0.3em] text-tx-muted mb-4 opacity-40">Stable Monthly Distribution</label>
          <span className="text-4xl font-black text-tx-primary tabular-nums tracking-tighter">{fmt(totalAnnual / 12)}</span>
          <p className="text-[9px] font-black text-tx-muted mt-5 opacity-30 uppercase tracking-[0.4em] italic leading-none">Optimized cash flow</p>
        </Card>

        <Card interactive className="p-8 flex flex-col items-center text-center shadow-premium border-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
          <label className="text-[10px] uppercase font-black tracking-[0.3em] text-tx-muted mb-4 opacity-40">Active Revenue Vectors</label>
          <div className="flex items-center gap-4">
             <span className="text-4xl font-black text-accent-light tabular-nums tracking-tighter">{rows.length}</span>
             <Badge variant="accent" size="sm" className="tracking-[0.3em] opacity-60 font-black uppercase text-[9px]">CHANNELS</Badge>
          </div>
          <p className="text-[9px] font-black text-tx-muted mt-5 opacity-30 uppercase tracking-[0.4em] italic leading-none">Risk differentiation</p>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-premium border-none">
        <div className="p-10 border-b border-border-base flex items-center justify-between bg-border-base/5">
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-tx-primary">Revenue Audit Worksheet</h3>
          <Badge variant="success" glow className="px-5 py-1 text-[9px] tracking-[0.3em] font-black uppercase">
             CLOUD_SYNC_ACTIVE
          </Badge>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-360px)]">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-border-base/60 shadow-premium">
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted sticky left-0 z-30 bg-secondary/95 backdrop-blur-xl border-r border-border-base/40">Revenue Source</th>
                {MONTH_LABELS.map(m => (
                  <th key={m} className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted text-right bg-secondary/95 backdrop-blur-xl">{m}</th>
                ))}
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.4em] text-accent-light text-right bg-tx-primary/[0.04] backdrop-blur-xl">Consolidated Annual</th>
                <th className="w-16 p-8 bg-tx-primary/[0.04] backdrop-blur-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                <tr><td colSpan={MONTH_KEYS.length + 3} className="py-40 text-center">
                   <div className="flex flex-col items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Sychronizing capital flows...</p>
                   </div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={MONTH_KEYS.length + 3} className="py-60 text-center">
                   <div className="flex flex-col items-center gap-8 opacity-20 grayscale">
                      <span className="text-7xl animate-bounce">📥</span>
                      <p className="text-[11px] font-black uppercase tracking-[0.5em] max-w-sm leading-loose">No records detected <br/> define your first revenue source</p>
                   </div>
                </td></tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="hover:bg-tx-primary/[0.02] transition-colors group h-20">
                    <td className="p-6 font-black text-[13px] text-tx-primary sticky left-0 z-10 bg-secondary border-r border-border-base/40 shadow-2xl">
                      <div className="flex items-center gap-5">
                         <div className={`w-3 h-3 rounded-full transition-all ${saving[row.id] ? 'bg-accent animate-ping' : 'bg-tx-primary/10 group-hover:bg-success/50 shadow-glow-success'}`} />
                         <span className="group-hover:text-success transition-colors uppercase tracking-[0.15em] shrink-0">{row.source}</span>
                         {saving[row.id] && <Badge variant="accent" size="sm" className="scale-90 origin-left font-black tracking-widest text-[8px]">SYNC</Badge>}
                      </div>
                    </td>
                    {MONTH_KEYS.map(m => (
                      <td key={m} className="p-3">
                        <input
                          type="number"
                          className="w-full bg-tx-primary/[0.03] hover:bg-tx-primary/[0.06] focus:bg-tx-primary/[0.1] focus:ring-2 focus:ring-accent-light/30 border-none rounded-2xl p-4 text-right font-black text-sm text-tx-primary transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={row[m] || ''}
                          onChange={e => handleCellChange(row.id, m, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className="p-6 text-right font-black text-base text-success bg-tx-primary/[0.02] tabular-nums tracking-tighter">
                      {fmt(totalRow(row))}
                    </td>
                    <td className="p-6 bg-tx-primary/[0.02]">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-12 h-12 p-0 text-tx-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-all"
                        onClick={() => setConfirmId(row.id)}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-30 shadow-premium">
                <tr className="bg-secondary/95 backdrop-blur-xl border-t border-border-base/60 h-28">
                  <td className="p-8 font-black text-[11px] uppercase tracking-[0.5em] text-tx-muted sticky left-0 z-30 bg-secondary/95 border-r border-border-base/40">ANNUALIZED TOTAL</td>
                  {totalsByMonth.map((t, i) => (
                    <td key={i} className="p-6 text-right font-black text-[17px] text-tx-primary tabular-nums tracking-tighter decoration-accent/30 underline underline-offset-8 transition-all hover:text-accent-light cursor-help decoration-4" title={`Consolidated total for ${MONTH_LABELS[i]}`}>{fmt(t)}</td>
                  ))}
                  <td className="p-8 text-right font-black text-[28px] text-success drop-shadow-glow-success tabular-nums tracking-tighter bg-tx-primary/[0.04] border-l border-border-base/60 underline decoration-success/20 underline-offset-[12px] decoration-4">{fmt(totalAnnual)}</td>
                  <td className="bg-tx-primary/[0.04]"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Modal New Source */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-primary/95 backdrop-blur-3xl" onClick={() => setModal(false)} />
          <Card className="max-w-xl w-full p-12 md:p-16 relative z-10 animate-in zoom-in-95 duration-500 rounded-[4rem] border-none shadow-premium bg-secondary">
            <div className="flex items-center justify-between mb-16">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-tx-primary uppercase tracking-tighter leading-none">New Flow Vector</h2>
                <Badge variant="success" className="tracking-[0.5em] font-black uppercase text-[9px] px-3 py-1">FLOW_EXPANSION_CORE</Badge>
              </div>
              <Button variant="ghost" className="w-14 h-14 p-0 rounded-3xl text-tx-muted hover:text-tx-primary" onClick={() => setModal(false)}>✕</Button>
            </div>
            
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-tx-muted ml-3">Channel Identifier / Source</label>
                <Input
                  autoFocus
                  className="text-2xl py-7 px-8 font-black tracking-tight"
                  value={newSource}
                  onChange={e => setNewSource(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                  placeholder="e.g.: Dividend Yield, Portfolio A..."
                />
              </div>
              <p className="text-[12px] font-medium text-tx-muted/50 leading-relaxed italic border-l-4 border-accent/40 pl-6 py-2 uppercase tracking-tight">
                A new matrix record vector will be enabled for fiscal cycle {year}. The audit engine will integrate this source into global health algorithms.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-16">
              <Button onClick={handleAddSource} variant="accent" className="flex-1 py-8 uppercase tracking-[0.4em] font-black shadow-glow-accent">
                 Deploy Stream
              </Button>
              <Button onClick={() => setModal(false)} variant="ghost" className="px-14 py-8 uppercase tracking-[0.3em] border border-border-base/60 font-black">
                 Ignore
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-400">
           <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl" onClick={() => setConfirmId(null)} />
           <Card className="max-w-[460px] w-full p-14 relative z-10 animate-in zoom-in-95 duration-400 rounded-[3.5rem] border-danger/30 text-center shadow-premium group">
              <div className="text-7xl mb-10 transition-transform group-hover:scale-110 duration-500 drop-shadow-glow-danger">⚠️</div>
              <h3 className="text-3xl font-black text-tx-primary uppercase tracking-tighter mb-6 leading-none">Security Override</h3>
              <p className="text-tx-secondary text-[14px] font-medium leading-relaxed mb-14 opacity-60 px-4">
                 Confirm total de-listing of source <strong className="text-tx-primary font-black underline decoration-danger/40 underline-offset-4">"{rows.find(r => r.id === confirmId)?.source}"</strong>? All annual historical vectors will be permanently purged.
              </p>
              <div className="flex gap-5 flex-col sm:flex-row">
                 <Button onClick={handleDeleteConfirm} variant="danger" className="flex-1 py-5 font-black uppercase tracking-[0.3em] text-[11px] shadow-glow-danger">Execute Purge</Button>
                 <Button onClick={() => setConfirmId(null)} variant="ghost" className="px-10 py-5 font-black uppercase tracking-[0.2em] text-[11px] border border-border-base/60">Abort Mission</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  )
}
