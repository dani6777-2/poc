import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { expenseService, revenueService } from '../services'
import { MONTH_LABELS, MONTH_KEYS, ACTUAL_MONTH_KEYS, CARD_MONTH_KEYS, YEARS } from '../constants/finance'
import { fmt } from '../utils/formatters'
import { isAutoSync } from '../utils/finance'
import { useFinance } from '../context/FinanceContext'
import { DashboardTemplate } from '../components/templates'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import Input from '../components/atoms/Input'
import Select from '../components/atoms/Select'
import KpiCard from '../components/molecules/KpiCard'
import VarBadge from '../components/molecules/VarBadge'
import ConfirmModal from '../components/molecules/ConfirmModal'
import AnnualExpenseTable from '../components/organisms/AnnualExpenseTable'
import { useToast } from '../context/ToastContext'

const totalPlanned = row => MONTH_KEYS.reduce((s, m) => s + (parseFloat(row[m]) || 0), 0)



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
  const [form, setForm] = useState({ section_id: '', category_id: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState(null)
  const [isDryRun, setIsDryRun] = useState(true)
  const [traceModal, setTraceModal] = useState(null)
  const [reconcileConfirm, setReconcileConfirm] = useState(false)
  const saveTimers = useRef({})

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [rowsData, revData, healthData] = await Promise.all([
        expenseService.getAnnualExpenses(year),
        revenueService.getRevenueSummary(year).catch(() => ({ by_month: {}, annual_total: 0 })),
        expenseService.getSystemHealth(year).catch(() => null)
      ])
      setRows(rowsData)
      setRevenues(revData)
      setHealth(healthData)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [year])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCellChange = (id, field, value) => {
      setRows(prev => prev.map(r => {
        if (r.id !== id) return r
        return { ...r, [field]: value }
      }))
  }

  const handleSaveRow = async (id) => {
    const current = rows.find(r => r.id === id)
    if (!current) return
    const payload = { ...current }
    for (const key in payload) {
        if (key === 'id' || key === 'tenant_id' || key === 'section_name' || key === 'category_name') continue;
        if (typeof payload[key] === 'string' && payload[key] === '' && key !== 'description') {
            payload[key] = null;
        } else if (typeof payload[key] === 'string' && !isNaN(payload[key]) && key !== 'description' && key !== 'section') {
            payload[key] = parseFloat(payload[key]);
            if (isNaN(payload[key])) payload[key] = null;
        }
    }
    setSaving(s => ({ ...s, [id]: true }))
    try {
      await expenseService.updateExpenseDetail(id, payload)
      addToast('Saved successfully', 'success')
      fetchData(true)
    } catch (err) {
      if (err.status === 409) {
        addToast('⚠️ CONFLICT: The matrix was updated by someone else. Refreshing...', 'warning')
        fetchData(true)
      } else {
        addToast('Error synchronizing cell', 'danger')
      }
    } finally {
      setSaving(s => ({ ...s, [id]: false }))
    }
  }

  const handleAdd = async () => {
    if (!form.section_id || !form.description.trim()) return
    try {
      await expenseService.createExpenseDetail({ 
        year, 
        section_id: parseInt(form.section_id), 
        category_id: form.category_id ? parseInt(form.category_id) : null,
        description: form.description.trim(), 
        sort_order: rows.length 
      })
      addToast('Concept added successfully', 'success')
      setModal(false)
      setForm({ section_id: '', category_id: '', description: '' })
      fetchData()
    } catch (e) { addToast('Error adding concept', 'danger') }
  }

  const handleDeleteConfirm = async () => {
    const id = confirmId
    setConfirmId(null)
    try {
      await expenseService.deleteExpenseDetail(id)
      addToast('Concept deleted', 'success')
      fetchData()
    } catch (e) { addToast('Error deleting', 'danger') }
  }

  const handleReconcile = async () => {
    if (!isDryRun && !reconcileConfirm) {
      setReconcileConfirm(true);
      return;
    }
    setReconcileConfirm(false);
    setLoading(true)
    try {
      const res = await expenseService.reconcileSystem(year, isDryRun)
      addToast(isDryRun ? 'Dry-Run Analysis Evaluated' : 'System mathematical integrity reconciled', 'success')
      if (res.status === 'NO_CHANGES_DETECTED') {
        addToast(isDryRun ? 'Simulation complete: No real changes detected' : 'Finished: No Changes Detected', 'warning')
      } else if (res.trace && res.trace.affected_records > 0) {
        setTraceModal({ ...res.trace, IS_DRY_RUN: isDryRun })
      } else if (res.trace?.affected_records === 0 && isDryRun) {
        addToast('Matrix verified: 0 discrepancies.', 'success')
      }
      if (!isDryRun) fetchData(true)
    } catch (e) {
      addToast('Error reconciling system', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const toggleCollapse = secId => setCollapsed(c => ({ ...c, [secId]: !c[secId] }))

  // Dashboard calculations
  const totalPlannedMonth = MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalActualMonth  = ACTUAL_MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalCardMonth    = CARD_MONTH_KEYS.map(m => rows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0))
  const totalPlannedAnnual = totalPlannedMonth.reduce((a, b) => a + b, 0)
  const totalActualAnnual  = totalActualMonth.reduce((a, b) => a + b, 0)
  const totalCardAnnual    = totalCardMonth.reduce((a, b) => a + b, 0)
  
  const totalExecutedAnnual = totalActualAnnual + totalCardAnnual;
  const totalCashAnnual    = totalActualAnnual

  const totalRevenuesMonth = MONTH_KEYS.map(m => (revenues.by_month?.[m]) || 0)
  const totalRevenuesAnnual = revenues.annual_total || 0

  const revenueCurrentMonth = totalRevenuesMonth[monthIdx] || 0
  const plannedCurrentMonth = totalPlannedMonth[monthIdx]
  const actualCurrentMonth  = totalActualMonth[monthIdx]
  const cardCurrentMonth    = totalCardMonth[monthIdx]
  const executedCurrentMonth = actualCurrentMonth + cardCurrentMonth
  
  const netMonth            = MONTH_KEYS.map((_, i) => (totalRevenuesMonth[i] || 0) - totalActualMonth[i])
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

  const { categories: ctxCategories } = useFinance()
  const filteredCategories = useMemo(() => {
    if (!form.section_id) return []
    return ctxCategories.filter(c => c.section_id === parseInt(form.section_id))
  }, [ctxCategories, form.section_id])

  return (
    <DashboardTemplate
      title={<>Annual <span className="text-accent italic font-light">Expenses Manager</span></>}
      subtitle="Multi-layer control and structural flow management"
      icon="📋"
      badge={`Fiscal Year ${year} Operational ${health?.status === 'warning' ? '⚠️ Inconsistencias detectadas' : (health ? '✅ Sin drift' : '')}`}
      loading={loading || ctxLoading}
      loadingText="Scanning structural flows..."
      headerAction={
        <div className="flex gap-3">
          <div className="glass p-1 rounded-xl">
            <select
              value={year} onChange={e => setYear(Number(e.target.value))}
              className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
            >
              {YEARS.map(y => <option key={y} value={y} className="bg-secondary">{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mr-4 bg-primary/20 px-3 py-2 rounded-xl">
             <label className="text-[10px] font-black uppercase text-tx-secondary tracking-widest whitespace-nowrap cursor-pointer">Dry Run Preview</label>
             <input type="checkbox" className="toggle-checkbox" checked={isDryRun} onChange={(e) => setIsDryRun(e.target.checked)} />
          </div>
          <Button onClick={handleReconcile} variant="secondary" size="sm" className="px-5 font-black uppercase tracking-[0.2em] h-12 shadow-md bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20">
             🔄 Reconcile Data
          </Button>
          <Button onClick={() => setModal(true)} variant="accent" size="sm" className="px-8 font-black uppercase tracking-[0.2em] h-12 shadow-glow-accent">
              + Inject Concept
          </Button>
        </div>
      }
    >
      {confirmId !== null && (
        <ConfirmModal
          mensaje="Delete this concept? All planned and actual linked data will be deleted."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {reconcileConfirm && (
        <ConfirmModal
          mensaje="Execute permanent database reconciliation? This will overwrite active matrix records according to backend rules."
          onConfirm={handleReconcile}
          onCancel={() => setReconcileConfirm(false)}
        />
      )}

      {traceModal && (
        <div className="fixed inset-0 bg-primary/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000] animate-in fade-in duration-500" onClick={e => e.target === e.currentTarget && setTraceModal(null)}>
          <Card className="max-w-[700px] w-full p-6 md:p-10 rounded-[3rem] border-none shadow-premium relative bg-secondary max-h-[80vh] overflow-y-auto no-scrollbar">
            <h3 className="text-2xl font-black text-tx-primary uppercase tracking-tighter mb-4">
              Reconciliation Audit Trace {traceModal.IS_DRY_RUN && <span className="text-warning text-sm bg-warning/10 px-3 py-1 rounded-full">[SIMULATION]</span>}
            </h3>
            <p className="text-tx-muted text-sm mb-6 uppercase tracking-widest font-black opacity-50">Affected matrix vectors: <span className="text-warning">{traceModal.affected_records}</span></p>
            {traceModal.affected_records_ids && (
                <p className="text-tx-muted text-[10px] mb-6 uppercase tracking-widest font-black opacity-30">Affected Keys: <span className="text-tx-primary select-all">{traceModal.affected_records_ids}</span></p>
            )}
            <div className="bg-primary/50 rounded-2xl p-4 font-mono text-[10px] sm:text-[12px] text-tx-secondary space-y-2">
              {traceModal.differences?.map((diff, i) => (
                <div key={i} className="border-b border-border-base/10 pb-2 mb-2 last:border-0">{diff}</div>
              ))}
            </div>
            <Button onClick={() => setTraceModal(null)} className="w-full mt-8 py-5 uppercase font-black tracking-widest">Acknowledge</Button>
          </Card>
        </div>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:p-8">
        <KpiCard label={`Revenues ${year}`} variant="success" value={fmt(totalRevenuesAnnual)}>
            <Link to="/revenues" className="inline-block mt-5 text-[9px] font-black text-accent hover:underline uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all">✏️ Flow Management</Link>
        </KpiCard>
        <KpiCard label="Budgeted" variant="warning" value={fmt(totalPlannedAnnual)}>
            <div className="text-[9px] font-black text-tx-muted mt-3 opacity-20 uppercase tracking-widest">{totalRevenuesAnnual > 0 ? `${Math.round(totalPlannedAnnual / totalRevenuesAnnual * 100)}% of revenue` : '—'}</div>
        </KpiCard>
          <KpiCard label="Actual Executed" variant="purple" value={fmt(totalExecutedAnnual)}>
              <div className="text-[9px] font-black text-tx-muted mt-3 opacity-20 uppercase tracking-widest">{totalRevenuesAnnual > 0 ? `${Math.round(totalExecutedAnnual / totalRevenuesAnnual * 100)}% of revenue` : '—'}</div>
          </KpiCard>
          <KpiCard label="Differential" variant={totalPlannedAnnual - totalExecutedAnnual >= 0 ? 'success' : 'danger'} value={fmt(totalPlannedAnnual - totalExecutedAnnual)} />
          <KpiCard label="Net Cash Flow" variant={(totalRevenuesAnnual - totalCashAnnual) >= 0 ? 'info' : 'danger'} value={fmt(totalRevenuesAnnual - totalCashAnnual)} />
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

          <Card className="p-6 lg:p-10 flex flex-wrap gap-x-16 gap-y-8 items-center border-none shadow-premium relative overflow-hidden">
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
              <div className="text-3xl font-black text-purple tabular-nums tracking-tighter">{fmt(executedCurrentMonth)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] mb-1 opacity-40">Month Delta</label>
              <div className={`text-3xl font-black tabular-nums tracking-tighter ${plannedCurrentMonth >= executedCurrentMonth ? 'text-success' : 'text-danger'}`}>
                {fmt(plannedCurrentMonth - executedCurrentMonth)}
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
        </div>
      )}

      <AnnualExpenseTable 
        view={view}
        loading={loading}
        sections={ctxSections}
        rowsGroupedBySection={rowsGroupedBySection}
        monthIdx={monthIdx}
        MONTH_LABELS={MONTH_LABELS}
        MONTH_KEYS={MONTH_KEYS}
        ACTUAL_MONTH_KEYS={ACTUAL_MONTH_KEYS}
        CARD_MONTH_KEYS={CARD_MONTH_KEYS}
        totalRevenuesMonth={totalRevenuesMonth}
        totalRevenuesAnnual={totalRevenuesAnnual}
        totalPlannedMonth={totalPlannedMonth}
        totalPlannedAnnual={totalPlannedAnnual}
        totalActualMonth={totalActualMonth}
        totalActualAnnual={totalActualAnnual}
        netMonth={netMonth}
        accumulated={accumulated}
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
        saving={saving}
        handleCellChange={handleCellChange}
          handleSaveRow={handleSaveRow}
        setConfirmId={setConfirmId}
        setForm={setForm}
        setModal={setModal}
        isAutoSync={isAutoSync}
        fmt={fmt}
        totalPlannedRow={totalPlanned}
      />

      {modal && (
        <div className="fixed inset-0 bg-primary/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000] animate-in fade-in duration-500" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <Card className="max-w-[520px] w-full p-6 md:p-12 md:p-8 lg:p-16 animate-in zoom-in-95 duration-700 rounded-[3.5rem] border-none shadow-premium relative bg-secondary overflow-hidden">
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
                <label className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2 opacity-50">Operational Category (Linking)</label>
                <Select
                  value={form.category_id}
                  onChange={e => {
                    const catId = e.target.value;
                    const cat = ctxCategories.find(c => c.id === parseInt(catId));
                    setForm(f => ({ 
                      ...f, 
                      category_id: catId,
                      description: cat ? `📦 ${cat.name}` : f.description
                    }))
                  }}
                  options={[{ value: '', label: '— No Linking —' }, ...filteredCategories.map(c => ({ value: c.id, label: c.name }))]}
                  className="h-14 rounded-2xl font-bold bg-tx-primary/5 border-border-base/40 text-[14px]"
                  disabled={!form.section_id}
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
    </DashboardTemplate>
  )
}   
