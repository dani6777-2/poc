import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { MONTH_LABELS, MONTH_KEYS, ACTUAL_MONTH_KEYS, CARD_MONTH_KEYS, YEARS } from '../constants/finance'
import { useFinance } from '../context/FinanceContext'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import ConfirmModal from '../components/molecules/ConfirmModal'
import { useToast } from '../context/ToastContext'

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
const totalPlanned = row => MONTH_KEYS.reduce((s, m) => s + (parseFloat(row[m]) || 0), 0)

const REGISTRY_DESCRIPTION_PREFIX = "📝 Registry: "
const AUTO_PREFIXES = [REGISTRY_DESCRIPTION_PREFIX, '💳 Card:', '🛒 Supermarket']
const isAutoSync = (description, is_automatic) => is_automatic || AUTO_PREFIXES.some(p => description?.startsWith(p))

function VarBadge({ plan, actual }) {
  if (!plan && !actual) return <span className="text-tx-muted text-[10px] opacity-20">—</span>
  const diff = plan - actual
  const ok = diff >= 0
  return (
    <Badge variant={ok ? 'success' : 'danger'} glow={!ok} className="font-black px-3 py-1 text-[10px]">
      {ok ? '▲' : '▼'} {fmt(Math.abs(diff))}
    </Badge>
  )
}

export default function AnnualExpenses() {
  const { sections: ctxSections, loading: ctxLoading } = useFinance()
  const { addToast } = useToast()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [monthIdx, setMonthIdx] = useState(now.getMonth())
  const [view, setView]     = useState('month')
  const [rows, setRows]     = useState([])
  const [revenues, setRevenues] = useState([])
  const [collapsed, setCollapsed] = useState({})
  const [saving, setSaving]   = useState({})
  const [modal, setModal]     = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [form, setForm] = useState({ section_id: '', description: '' })
  const [loading, setLoading] = useState(true)
  const saveTimers = useRef({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rowsRes, revRes] = await Promise.all([
        api.get(`/expense-details/${year}`),
        api.get(`/revenues/${year}/summary`).catch(() => ({ data: { by_month: {}, annual_total: 0 } }))
      ])
      setRows(rowsRes.data)
      setRevenues(revRes.data)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCellChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    clearTimeout(saveTimers.current[`${id}_${field}`])
    saveTimers.current[`${id}_${field}`] = setTimeout(() => {
      setRows(prev => {
        const current = prev.find(r => r.id === id)
        if (!current) return prev
        const payload = { ...current }
        for (const key in payload) {
            if (key === 'id' || key === 'tenant_id' || key === 'section_name') continue;
            if (typeof payload[key] === 'string' && payload[key] === '' && key !== 'description') payload[key] = 0
            else if (typeof payload[key] === 'string' && !isNaN(payload[key]) && key !== 'description' && key !== 'section') {
                payload[key] = parseFloat(payload[key]) || 0
            }
        }
        setSaving(s => ({ ...s, [id]: true }))
        api.put(`/expense-details/${id}`, payload)
          .catch(() => addToast('Error synchronizing cell', 'danger'))
          .finally(() => setSaving(s => ({ ...s, [id]: false })))
        return prev
      })
    }, 800)
  }

  const handleAdd = async () => {
    if (!form.section_id || !form.description.trim()) return
    try {
      await api.post('/expense-details/', { 
        year, 
        section_id: parseInt(form.section_id), 
        description: form.description.trim(), 
        sort_order: rows.length 
      })
      addToast('Concept added successfully', 'success')
      setModal(false)
      setForm({ section_id: '', description: '' })
      fetchData()
    } catch (e) { addToast('Error adding concept', 'danger') }
  }

  const handleDeleteConfirm = async () => {
    const id = confirmId
    setConfirmId(null)
    try {
      await api.delete(`/expense-details/${id}`)
      addToast('Concept deleted', 'success')
      fetchData()
    } catch (e) { addToast('Error deleting', 'danger') }
  }

  const toggleCollapse = secId => setCollapsed(c => ({ ...c, [secId]: !c[secId] }))

  // Dashboard calculations
  const totalPlannedMonth = MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalActualMonth  = ACTUAL_MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalCardMonth    = CARD_MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalPlannedAnnual = totalPlannedMonth.reduce((a, b) => a + b, 0)
  const totalActualAnnual  = totalActualMonth.reduce((a, b) => a + b, 0)
  const totalCardAnnual    = totalCardMonth.reduce((a, b) => a + b, 0)
  const totalCashAnnual    = totalActualAnnual - totalCardAnnual
  const totalRevenuesMonth = MONTH_KEYS.map(m => (revenues.by_month?.[m]) || 0)
  const totalRevenuesAnnual = revenues.annual_total || 0
  const revenueCurrentMonth = totalRevenuesMonth[monthIdx] || 0
  const plannedCurrentMonth = totalPlannedMonth[monthIdx]
  const actualCurrentMonth  = totalActualMonth[monthIdx]
  const netMonth            = MONTH_KEYS.map((_, i) => (totalRevenuesMonth[i] || 0) - (totalActualMonth[i] - totalCardMonth[i]))
  const accumulated         = netMonth.reduce((acc, n, i) => [...acc, (acc[i - 1] || 0) + n], [])

  const rowsGroupedBySection = useMemo(() => {
    const groups = {}
    rows.forEach(r => {
      groups[r.section_id] = groups[r.section_id] || []
      groups[r.section_id].push(r)
    })
    return groups
  }, [rows])

  const sectionOptions = useMemo(() => ctxSections.map(s => ({ value: s.id, label: s.name })), [ctxSections])

  return (
    <div className="page-entry pb-20 space-y-10 group">
      {confirmId !== null && (
        <ConfirmModal
          mensaje="Delete this concept? All planned and actual linked data will be deleted."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <PageHeader
        title={<>Annual <span className="text-accent italic font-light">Expenses Manager</span></>}
        subtitle="Multi-layer control and structural flow management"
        icon="📋"
        badge={`Fiscal Year ${year} Operational`}
        actions={
          <div className="flex gap-3">
            <div className="glass p-1 rounded-xl">
              <select
                value={year} onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
              >
                {YEARS.map(y => <option key={y} value={y} className="bg-secondary">{y}</option>)}
              </select>
            </div>
            <Button onClick={() => setModal(true)} variant="accent" size="sm" className="px-8 font-black uppercase tracking-[0.2em] h-12 shadow-glow-accent">
                + Inject Concept
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 p-1.5 glass w-full sm:w-fit rounded-2xl overflow-x-auto no-scrollbar shadow-premium">
        {[
          { id: 'month', label: '📅 Current Month', sub: 'Plan vs Actual' },
          { id: 'annual', label: '📋 Annual Plan', sub: '12m Audit' },
          { id: 'comp', label: '📊 Comparison', sub: 'Delta Vector' },
        ].map(v => (
          <button
            key={v.id} onClick={() => setView(v.id)}
            className={`flex flex-col items-center sm:items-start px-8 py-3 rounded-xl transition-all duration-500 min-w-[150px] ${view === v.id ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{v.label}</span>
            <span className={`text-[9px] font-bold opacity-40 mt-1 uppercase tracking-tighter ${view === v.id ? 'text-white/80' : ''}`}>{v.sub}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        <Card interactive className="p-8 border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-success opacity-30" />
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">Revenues {year}</label>
          <div className="text-2xl font-black text-success tabular-nums tracking-tighter drop-shadow-sm">{fmt(totalRevenuesAnnual)}</div>
          <Link to="/revenues" className="inline-block mt-5 text-[9px] font-black text-accent hover:underline uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all">✏️ Flow Management</Link>
        </Card>
        <Card interactive className="p-8 border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-warning opacity-30" />
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">Budgeted</label>
          <div className="text-2xl font-black text-warning tabular-nums tracking-tighter">{fmt(totalPlannedAnnual)}</div>
          <div className="text-[9px] font-black text-tx-muted mt-3 opacity-20 uppercase tracking-widest">{totalRevenuesAnnual > 0 ? `${Math.round(totalPlannedAnnual / totalRevenuesAnnual * 100)}% of revenue` : '—'}</div>
        </Card>
        <Card interactive className="p-8 border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple opacity-30" />
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">Actual Expense</label>
          <div className="text-2xl font-black text-purple tabular-nums tracking-tighter">{fmt(totalActualAnnual)}</div>
          <div className="text-[9px] font-black text-tx-muted mt-3 opacity-20 uppercase tracking-widest">{totalRevenuesAnnual > 0 ? `${Math.round(totalActualAnnual / totalRevenuesAnnual * 100)}% of revenue` : '—'}</div>
        </Card>
        <Card interactive className="p-8 border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-30" />
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">Differential</label>
          <div className={`text-2xl font-black tabular-nums tracking-tighter ${totalPlannedAnnual - totalActualAnnual >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(totalPlannedAnnual - totalActualAnnual)}</div>
        </Card>
        <Card interactive className="p-8 border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-info opacity-30" />
          <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">Net Cash Flow</label>
          <div className={`text-2xl font-black tabular-nums tracking-tighter ${(totalRevenuesAnnual - totalCashAnnual) >= 0 ? 'text-info' : 'text-danger'}`}>{fmt(totalRevenuesAnnual - totalCashAnnual)}</div>
        </Card>
      </div>

      {view === 'month' && (
        <div className="space-y-10 page-entry">
          <div className="glass p-2 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar max-w-full shadow-premium">
            {MONTH_LABELS.map((label, i) => (
              <button
                key={i} onClick={() => setMonthIdx(i)}
                className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap tracking-widest ${monthIdx === i ? 'bg-accent text-white shadow-glow-accent' : 'text-tx-secondary hover:bg-tx-primary/10'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <Card className="p-10 flex flex-wrap gap-x-16 gap-y-8 items-center border-none shadow-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] mb-1 opacity-40">Month Revenue</label>
              <div className="text-3xl font-black text-success tabular-nums tracking-tighter drop-shadow-sm">{fmt(revenueCurrentMonth)}</div>
            </div>
            <div className="w-px h-12 bg-border-base/40 hidden sm:block" />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] mb-1 opacity-40">Budget</label>
              <div className="text-3xl font-black text-warning tabular-nums tracking-tighter">{fmt(plannedCurrentMonth)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] mb-1 opacity-40">Actual Executed</label>
              <div className="text-3xl font-black text-purple tabular-nums tracking-tighter">{fmt(actualCurrentMonth)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] mb-1 opacity-40">Month Delta</label>
              <div className={`text-3xl font-black tabular-nums tracking-tighter ${plannedCurrentMonth >= actualCurrentMonth ? 'text-success' : 'text-danger'}`}>
                {fmt(plannedCurrentMonth - actualCurrentMonth)}
              </div>
            </div>
            {revenueCurrentMonth > 0 && (
              <div className="sm:ml-auto glass px-8 py-5 rounded-[2rem] border border-success/20 shadow-glow-success/10">
                <label className="text-[10px] font-black text-success uppercase tracking-[0.4em] mb-1 opacity-60">Net Liquidity</label>
                <div className={`text-3xl font-black tabular-nums tracking-tighter ${(revenueCurrentMonth - actualCurrentMonth) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {fmt(revenueCurrentMonth - actualCurrentMonth)}
                </div>
              </div>
            )}
          </Card>

          {loading ? (
            <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
              <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Synchronizing cost centers...</p>
            </div>
          ) : ctxSections.map(sec => {
            const secRows = rowsGroupedBySection[sec.id] || []
            const monthKey = MONTH_KEYS[monthIdx]
            const realMonthKey = ACTUAL_MONTH_KEYS[monthIdx]
            const cardMonthKey = CARD_MONTH_KEYS[monthIdx]

            const planSec = secRows.reduce((s, r) => s + (parseFloat(r[monthKey]) || 0), 0)
            const actualSec = secRows.reduce((s, r) => s + (parseFloat(r[realMonthKey]) || 0), 0)
            const tcSec = secRows.reduce((s, r) => s + (parseFloat(r[cardMonthKey]) || 0), 0)
            const color = sec.color_accent || '#6366f1'

            return (
              <Card key={sec.id} className="overflow-hidden border-none shadow-premium relative" style={{ borderLeft: `8px solid ${color}` }}>
                <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors" onClick={() => toggleCollapse(sec.id)}>
                  <div className="flex items-center gap-5">
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 filter drop-shadow-sm">{sec.icon || '📂'}</span>
                    <div className="flex flex-col">
                        <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.3em]">{sec.name}</h3>
                        <Badge variant="muted" size="sm" className="w-fit mt-2 opacity-30 font-black tracking-[0.2em] uppercase text-[8px]">Sec_ID {sec.id}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-12 items-center">
                    <div className="hidden md:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em]">
                      <div className="flex flex-col items-end">
                          <span className="text-tx-muted opacity-40 text-[9px]">PLAN</span>
                          <span className="text-warning font-black tracking-tighter text-base">{fmt(planSec)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className="text-tx-muted opacity-40 text-[9px]">ACTUAL</span>
                          <span className={`font-black tracking-tighter text-base ${actualSec > planSec ? 'text-danger' : 'text-success'}`}>{fmt(actualSec)}</span>
                      </div>
                      {tcSec > 0 && (
                          <div className="flex flex-col items-end">
                            <span className="text-tx-muted opacity-40 text-[9px]">CARD</span>
                            <span className="text-danger-light font-black tracking-tighter text-base">{fmt(tcSec)}</span>
                          </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="px-5 h-10 border border-border-base/40 uppercase font-black text-[9px] tracking-widest opacity-40 hover:opacity-100" onClick={e => { e.stopPropagation(); setForm({ section_id: sec.id, description: '' }); setModal(true) }}>+ Inject</Button>
                    <span className="text-tx-muted opacity-20 px-4 transition-transform duration-500" style={{ transform: collapsed[sec.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                  </div>
                </div>

                {!collapsed[sec.id] && (
                  <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted bg-tx-primary/[0.02] border-b border-border-base/40">
                          <th className="p-7 pl-10">Operational Concept</th>
                          <th className="p-7 text-right w-48">📈 Budget</th>
                          <th className="p-7 text-right w-48">🎯 Actual</th>
                          <th className="p-7 text-right w-48">💳 Card</th>
                          <th className="p-7 text-right">Differential</th>
                          <th className="p-7 text-right w-24">Rev. Ratio</th>
                          <th className="w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base/60">
                        {secRows.map(row => {
                          const auto = isAutoSync(row.description, row.is_automatic)
                          const planV = parseFloat(row[monthKey]) || 0
                          const actualV = parseFloat(row[realMonthKey]) || 0
                          const cardV = parseFloat(row[cardMonthKey]) || 0
                          const revRatio = revenueCurrentMonth > 0 ? (actualV || planV) / revenueCurrentMonth * 100 : 0
                          return (
                            <tr key={row.id} className={`hover:bg-tx-primary/[0.04] transition-all group ${auto ? 'bg-accent/[0.03]' : ''} h-20`}>
                              <td className="p-5 pl-10">
                                <div className="flex items-center gap-4">
                                  {saving[row.id] ? <div className="w-3 h-3 rounded-full bg-accent animate-ping" /> : <div className="w-3 h-3 rounded-full bg-tx-primary/10 group-hover:bg-accent/40" />}
                                  <div className="flex flex-col">
                                      <span className={`text-base font-black tracking-tight leading-none uppercase group-hover:text-accent transition-colors ${auto ? 'italic text-tx-muted mb-1' : 'text-tx-primary'}`}>{row.description}</span>
                                      <span className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30 mt-1.5">{auto ? "SYNC_STREAM_ACTIVE" : "MANUAL_ENTRY_IO"}</span>
                                  </div>
                                  {auto && <Badge variant="accent" glow className="scale-75 origin-left font-black tracking-widest text-[8px] px-2 py-0.5 shadow-glow-accent/20">AUT</Badge>}
                                </div>
                              </td>
                                <td className="p-3 text-right">
                                  {auto ? <span className="text-sm font-black text-warning/50 px-5 tabular-nums tracking-tighter">{planV > 0 ? fmt(planV) : '—'}</span> : (
                                      <input type="number" value={row[monthKey] || ''} onChange={e => handleCellChange(row.id, monthKey, e.target.value)}
                                      className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-accent/5 focus:ring-2 focus:ring-accent/20 rounded-[1rem] px-5 text-right text-sm font-black text-warning outline-none transition-all [appearance:textfield] tracking-tighter" placeholder="$0" />
                                  )}
                                </td>
                              <td className="p-3 text-right">
                                  <input type="number" value={row[realMonthKey] || ''} onChange={e => handleCellChange(row.id, realMonthKey, e.target.value)}
                                  className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-purple/5 focus:ring-2 focus:ring-purple/20 rounded-[1rem] px-5 text-right text-sm font-black text-purple outline-none transition-all [appearance:textfield] tracking-tighter" placeholder="$0" />
                              </td>
                              <td className="p-3 text-right">
                                  <input type="number" value={row[cardMonthKey] || ''} onChange={e => handleCellChange(row.id, cardMonthKey, e.target.value)}
                                  className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-danger/5 focus:ring-2 focus:ring-danger/20 rounded-[1rem] px-5 text-right text-sm font-black text-danger outline-none transition-all [appearance:textfield] tracking-tighter" placeholder="$0" />
                              </td>
                              <td className="p-5 text-right"><VarBadge plan={planV} actual={actualV} /></td>
                              <td className="p-5 text-right text-[11px] font-black text-tx-muted tabular-nums opacity-60">{revRatio > 0 ? `${revRatio.toFixed(1)}%` : '—'}</td>
                              <td className="p-5 text-right">
                                {!auto && (
                                    <Button 
                                        variant="ghost" 
                                        className="p-3 rounded-xl text-tx-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all" 
                                        onClick={() => setConfirmId(row.id)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
                                    </Button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-tx-primary/[0.04] border-t border-border-base/40 relative">
                        <tr className="font-black text-[12px] text-tx-primary uppercase tracking-[0.3em] h-20">
                          <td className="p-7 pl-10">Consolidated Total {sec.name}</td>
                          <td className="p-7 text-right text-warning text-lg tracking-tighter drop-shadow-sm">{fmt(planSec)}</td>
                          <td className="p-7 text-right text-purple text-lg tracking-tighter">{fmt(actualSec)}</td>
                          <td className="p-7 text-right text-danger-light text-lg tracking-tighter">{tcSec > 0 ? fmt(tcSec) : '—'}</td>
                          <td className="p-7 text-right"><VarBadge plan={planSec} actual={actualSec} /></td>
                          <td className="p-7 text-right text-tx-muted opacity-60 text-[11px]">{revenueCurrentMonth > 0 ? `${Math.round(actualSec / revenueCurrentMonth * 100)}%` : '—'}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {view === 'annual' && (
        <div className="space-y-10 page-entry">
          <Card className="overflow-hidden border-none shadow-premium">
            <div className="p-10 border-b border-border-base bg-tx-primary/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <Badge variant="purple" glow className="px-5 py-1.5 font-black uppercase tracking-[0.3em] text-[9px]">Prospective Analysis</Badge>
                    <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-tx-primary">Consolidated Annual Capital Matrix</h3>
                </div>
                <Badge variant="muted" className="opacity-40 tracking-widest font-black text-[9px]">IO_CORE_PLANNER</Badge>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="sticky top-0 z-20">
                  <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted bg-secondary/95 backdrop-blur-xl border-b border-border-base/40">
                    <th className="p-7 px-10 sticky left-0 z-30 bg-secondary shadow-2xl border-r border-border-base/40">Liquidity Vectors</th>
                    {MONTH_LABELS.map(m => <th key={m} className="p-7 text-right bg-secondary/80">{m}</th>)}
                    <th className="p-7 text-right text-tx-primary bg-tx-primary/[0.04]">Total Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base/40">
                  <tr className="hover:bg-success/[0.02] transition-colors group">
                    <td className="p-6 px-10 font-black text-[13px] text-success sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                        (+) Actual Revenues
                        <div className="text-[8px] opacity-30 mt-2 font-black">REVENUE_STREAM_V4</div>
                    </td>
                    {totalRevenuesMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-success/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                    <td className="p-6 text-right font-black text-base text-success tabular-nums tracking-tighter bg-success/[0.02]">{fmt(totalRevenuesAnnual)}</td>
                  </tr>
                  <tr className="hover:bg-warning/[0.02] transition-colors group">
                    <td className="p-6 px-10 font-black text-[13px] text-warning sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                        (-) Plan Budget
                        <div className="text-[8px] opacity-30 mt-2 font-black">BUDGET_CEILING_IO</div>
                    </td>
                    {totalPlannedMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-warning/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                    <td className="p-6 text-right font-black text-base text-warning tabular-nums tracking-tighter bg-warning/[0.02]">{fmt(totalPlannedAnnual)}</td>
                  </tr>
                  <tr className="hover:bg-purple/[0.02] transition-colors group">
                    <td className="p-6 px-10 font-black text-[13px] text-purple sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                        (-) Actual Execution
                        <div className="text-[8px] opacity-30 mt-2 font-black">TRANSACTION_DETECTION</div>
                    </td>
                    {totalActualMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-purple/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                    <td className="p-6 text-right font-black text-base text-purple tabular-nums tracking-tighter bg-purple/[0.02]">{fmt(totalActualAnnual)}</td>
                  </tr>
                  <tr className="bg-tx-primary/[0.06] border-t-2 border-border-base relative">
                    <td className="p-8 px-10 font-black text-[15px] text-tx-primary sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-[0.2em] shadow-2xl">Net Surplus</td>
                    {netMonth.map((v, i) => <td key={i} className={`p-8 text-right font-black text-base tabular-nums tracking-tighter ${v >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(v)}</td>)}
                    <td className={`p-8 text-right font-black text-xl tabular-nums tracking-tighter ${(totalRevenuesAnnual - totalActualAnnual) >= 0 ? 'text-success drop-shadow-glow-success' : 'text-danger drop-shadow-glow-danger'}`}>{fmt(totalRevenuesAnnual - totalActualAnnual)}</td>
                  </tr>
                  <tr className="bg-accent/[0.08] shadow-inner">
                    <td className="p-8 px-10 font-black text-[15px] text-accent-light sticky left-0 z-20 bg-secondary/90 border-r border-border-base/40 uppercase tracking-[0.2em]">Accumulated Cash</td>
                    {accumulated.map((v, i) => <td key={i} className={`p-8 text-right font-black text-base tabular-nums tracking-tighter ${v >= 0 ? 'text-accent-light' : 'text-danger-light'}`}>{fmt(v)}</td>)}
                    <td className="bg-secondary/90" />
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {ctxSections.map(sec => {
            const secRows = rowsGroupedBySection[sec.id] || []
            const secTotals = MONTH_KEYS.map(m => secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
            const secTotal = secTotals.reduce((a, b) => a + b, 0)
            const color = sec.color_accent || '#6366f1'
            return (
              <Card key={sec.id} border={false} className="overflow-hidden border-none shadow-premium relative" style={{ borderLeft: `6px solid ${color}` }}>
                <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors" onClick={() => toggleCollapse(sec.id)}>
                  <div className="flex items-center gap-5">
                    <span className="text-3xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all duration-700">{sec.icon || '📂'}</span>
                    <h4 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.3em]">{sec.name}</h4>
                  </div>
                  <div className="flex gap-12 items-center">
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">ANNUALIZED TOTAL</span>
                      <div className="flex items-center gap-4">
                        <strong className="text-xl font-black text-tx-primary tracking-tighter transition-all">{fmt(secTotal)}</strong>
                        {totalRevenuesAnnual > 0 && <Badge variant="muted" className="font-black uppercase text-[10px] tracking-widest">{Math.round(secTotal / totalRevenuesAnnual * 100)}% REV</Badge>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="px-5 h-10 border border-border-base/40 uppercase font-black text-[9px] tracking-widest opacity-40 hover:opacity-100" onClick={e => { e.stopPropagation(); setForm({ section_id: sec.id, description: '' }); setModal(true) }}>+ Registry</Button>
                    <span className="text-tx-muted opacity-20 px-4 transition-transform duration-500" style={{ transform: collapsed[sec.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                  </div>
                </div>

                {!collapsed[sec.id] && (
                  <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40">
                    <table className="w-full text-left border-collapse min-w-[1400px]">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-tx-muted/40 tracking-[0.3em] bg-tx-primary/[0.02] border-b border-border-base/40">
                          <th className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-xl border-r border-border-base/40">Expense Line</th>
                          {MONTH_LABELS.map(m => <th key={m} className="p-6 text-right tabular-nums">{m}</th>)}
                          <th className="p-6 text-right text-tx-primary bg-tx-primary/[0.04]">Balance</th>
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base/40">
                        {secRows.map(row => {
                          const auto = isAutoSync(row.description, row.is_automatic)
                          return (
                            <tr key={row.id} className={`hover:bg-tx-primary/[0.02] transition-colors group h-16 ${auto ? 'bg-accent/[0.02]' : ''}`}>
                              <td className="p-3 px-10 text-[13px] font-black text-tx-primary sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl flex items-center gap-3">
                                {saving[row.id] && <div className="w-2 h-2 rounded-full bg-accent animate-ping" />}
                                <span className="uppercase tracking-widest group-hover:text-accent transition-colors truncate">{row.description}</span>
                                {auto && <Badge variant="info" className="scale-[0.6] origin-left font-black">AUTO</Badge>}
                              </td>
                              {MONTH_KEYS.map(m => (
                                <td key={m} className="p-1.5 px-3">
                                  {auto ? <span className="block text-right text-[11px] font-bold text-tx-primary/30 py-3 tabular-nums tracking-tighter">{(parseFloat(row[m]) || 0) > 0 ? fmt(parseFloat(row[m])) : '—'}</span> : (
                                      <input type="number" value={row[m] || ''} onChange={e => handleCellChange(row.id, m, e.target.value)}
                                      className="w-full h-10 bg-tx-primary/[0.01] hover:bg-tx-primary/[0.05] focus:bg-accent/5 focus:ring-1 focus:ring-accent/20 rounded-xl px-3 text-right text-[11px] font-bold text-tx-primary outline-none transition-all [appearance:textfield] tracking-tighter" placeholder="0" />
                                  )}
                                </td>
                              ))}
                              <td className="p-4 text-right font-black text-[13px] text-tx-primary bg-tx-primary/[0.04] tabular-nums tracking-tighter">{fmt(totalPlanned(row))}</td>
                              <td className="p-4 text-right">
                                {!auto && (
                                    <Button 
                                        variant="ghost" 
                                        className="p-2 rounded-lg hover:bg-danger/10 text-tx-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all" 
                                        onClick={() => setConfirmId(row.id)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
                                    </Button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t border-border-base/40 bg-tx-primary/[0.06] text-[11px] font-black uppercase text-tx-secondary tracking-[0.2em] relative">
                        <tr className="h-20">
                          <td className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-2xl border-r border-border-base/40">Aggregate Sum {sec.name}</td>
                          {secTotals.map((t, i) => <td key={i} className="p-6 text-right tabular-nums tracking-tighter">{fmt(t)}</td>)}
                          <td className="p-6 text-right text-tx-primary tabular-nums tracking-tighter text-lg">{fmt(secTotal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {view === 'comp' && (
        <div className="space-y-10 page-entry">
          {ctxSections.map(sec => {
            const secRows = rowsGroupedBySection[sec.id] || []
            if (secRows.length === 0) return null
            const color = sec.color_accent || '#6366f1'
            const plannedMonths = MONTH_KEYS.map(m => secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
            const actualMonths  = ACTUAL_MONTH_KEYS.map(m => secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
            const plannedTotal = plannedMonths.reduce((a, b) => a + b, 0)
            const actualTotal  = actualMonths.reduce((a, b) => a + b, 0)

            return (
              <Card key={sec.id} className="overflow-hidden border-none shadow-premium relative" style={{ borderLeft: `6px solid ${color}` }}>
                <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors" onClick={() => toggleCollapse(sec.id)}>
                  <div className="flex items-center gap-5">
                    <span className="text-3xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all duration-700">{sec.icon || '📂'}</span>
                    <h4 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.3em]">{sec.name}</h4>
                  </div>
                  <div className="flex gap-16 items-center">
                    <div className="hidden lg:flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-tx-muted opacity-60">
                      <div className="flex flex-col items-end">
                          <span>PLAN</span>
                          <span className="text-warning font-black text-[15px] tracking-tighter mt-1">{fmt(plannedTotal)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span>ACTUAL</span>
                          <span className={`font-black text-[15px] tracking-tighter mt-1 ${actualTotal > plannedTotal ? 'text-danger' : 'text-success'}`}>{fmt(actualTotal)}</span>
                      </div>
                    </div>
                    <VarBadge plan={plannedTotal} actual={actualTotal} />
                    <span className="text-tx-muted opacity-20 px-4 transition-transform duration-500" style={{ transform: collapsed[sec.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                  </div>
                </div>

                {!collapsed[sec.id] && (
                  <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40 shadow-inner">
                    <table className="w-full text-left border-collapse min-w-[1400px]">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted/40 bg-tx-primary/[0.02] border-b border-border-base/40">
                          <th className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-lg border-r border-border-base/40">Analytical Layer</th>
                          {MONTH_LABELS.map(m => <th key={m} className="p-6 text-right tracking-widest">{m}</th>)}
                          <th className="p-6 text-right text-tx-primary bg-tx-primary/[0.04]">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base/40">
                        <tr className="hover:bg-warning/[0.03] transition-colors relative h-16">
                          <td className="p-5 px-10 text-[11px] font-black text-warning uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-widest leading-none">
                              ⏳ Budget
                              <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">ESTIMATED_FLOW</div>
                          </td>
                          {plannedMonths.map((v, i) => <td key={i} className="p-5 text-right font-black text-xs text-warning/70 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                          <td className="p-5 text-right font-black text-sm text-warning tabular-nums tracking-tighter bg-warning/[0.03]">{fmt(plannedTotal)}</td>
                        </tr>
                        <tr className="hover:bg-purple/[0.03] transition-colors relative h-16">
                          <td className="p-5 px-10 text-[11px] font-black text-purple uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-widest leading-none">
                              🔍 Actual Expense
                              <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">EVIDENCED_BURN</div>
                          </td>
                          {actualMonths.map((v, i) => <td key={i} className="p-5 text-right font-black text-xs text-purple/70 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                          <td className="p-5 text-right font-black text-sm text-purple tabular-nums tracking-tighter bg-purple/[0.03]">{fmt(actualTotal)}</td>
                        </tr>
                        <tr className="bg-tx-primary/[0.05] border-t-2 border-border-base/20 relative h-20">
                          <td className="p-6 px-10 text-[12px] font-black text-tx-primary uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-[0.2em] leading-none">
                              ⚖️ Variance
                              <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">VARIANCE_AUDIT</div>
                          </td>
                          {plannedMonths.map((p, i) => {
                            const diff = p - actualMonths[i]
                            return <td key={i} className={`p-6 text-right font-black text-xs tabular-nums tracking-tighter ${diff >= 0 ? 'text-success' : 'text-danger'}`}>{p || actualMonths[i] ? fmt(diff) : '—'}</td>
                          })}
                          <td className={`p-6 text-right font-black text-base tabular-nums tracking-tighter ${(plannedTotal - actualTotal) >= 0 ? 'text-success drop-shadow-glow-success' : 'text-danger drop-shadow-glow-danger'}`}>{fmt(plannedTotal - actualTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-primary/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000] animate-in fade-in duration-500" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <Card className="max-w-[520px] w-full p-12 md:p-16 animate-in zoom-in-95 duration-700 rounded-[3.5rem] border-none shadow-premium relative bg-secondary overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-14 relative z-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-tx-primary tracking-tighter leading-none uppercase">Deploy Logic</h3>
                <Badge variant="accent" className="font-black uppercase tracking-[0.4em] text-[8px] px-3 py-1 mt-3">ANNUAL_PLANNER_MODULE</Badge>
              </div>
              <Button variant="ghost" size="sm" className="w-12 h-12 rounded-2xl flex items-center justify-center text-tx-muted hover:text-tx-primary transition-all" onClick={() => setModal(false)}>✕</Button>
            </div>

            <div className="space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2 opacity-50">Strategic Section</label>
                <Select
                  value={form.section_id}
                  onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                  options={[{ value: '', label: '— Select Domain —' }, ...sectionOptions]}
                  className="h-14 rounded-2xl font-bold bg-tx-primary/5 border-border-base/40 text-[14px]"
                />
              </div>
              <div className="space-y-4">
                  <label className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2 opacity-50">Identifying Concept</label>
                  <Input 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} 
                    placeholder="e.g. Mortgage Amortization, Cloud Sync..." 
                    className="h-14 rounded-2xl bg-tx-primary/5 px-6 font-bold"
                  />
              </div>
              <p className="text-[12px] font-medium text-tx-muted/60 leading-relaxed italic border-l-4 border-accent/30 pl-6 py-2 uppercase tracking-tight">
                The new cost center will be injected into the dynamic matrix. Audit algorithms will integrate this vector into the annualized variance calculation for {year}.
              </p>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row gap-5 relative z-10">
              <Button className="flex-1 py-7 uppercase font-black tracking-[0.3em] shadow-glow-accent" onClick={handleAdd}>Deploy Vector</Button>
              <Button variant="ghost" className="px-12 py-7 uppercase font-black tracking-[0.2em] border border-border-base/40" onClick={() => setModal(false)}>Abort</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
