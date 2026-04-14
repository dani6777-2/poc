import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { financeService, analysisService } from '../services'
import { RECENT_MONTHS } from '../constants/time'
import { fmt } from '../utils/formatters'
import { useFinance } from '../context/FinanceContext'

export default function Budget() {
  const { sections, getSection, loaded: taxonomiesLoaded } = useFinance()
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [rows, setRows]   = useState([])
  const [kpis, setKpis]   = useState({})
  const [refSection, setRefSection] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
        const [presData, anlData] = await Promise.all([
          financeService.getBudgets(month),
          analysisService.getAnalysis(month),
        ])

        const catExpense = {}
        ;(anlData.category_chart || []).forEach(c => { catExpense[c.category] = c.actual })
        
        const synced = presData.map(row => ({
            ...row,
            actual_expense: catExpense[row.category_name] ?? row.actual_expense
        }))
        
        setRows(synced)
        setKpis(anlData.kpis || {})
        setRefSection(anlData.ref_section_month || {})
    } finally {
        setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = (id, field, value) => {
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row))
  }

  const handleSave = async (row) => {
    setSaving(s => ({ ...s, [row.id]: true }))
    try {
        await financeService.updateBudget(row.id, row)
    } finally {
        setSaving(s => ({ ...s, [row.id]: false }))
    }
  }

  const totalBudget    = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.budget) || 0), 0), [rows])
  const totalActual    = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.actual_expense) || 0), 0), [rows])
  const totalRevenue   = kpis.total_revenue || 0
  const balance        = totalRevenue > 0 ? totalRevenue - totalActual : totalBudget - totalActual
  const pct            = (totalRevenue > 0 ? totalRevenue : totalBudget) > 0
    ? Math.round(totalActual / (totalRevenue > 0 ? totalRevenue : totalBudget) * 100) : 0

  const sectionsWithRef = useMemo(() => 
    sections.filter(s => refSection[s.name] > 0), 
    [sections, refSection]
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-[32px] font-black tracking-tight text-tx-primary mb-1 flex items-center gap-3">
             <span className="drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">💰</span> Budget
          </h1>
          <p className="text-tx-secondary text-sm font-bold uppercase tracking-[0.15em] opacity-60">Granular Control · Monthly Limits Management</p>
        </div>
        <div className="glass p-1 rounded-xl">
          <select 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
          >
            {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
          </select>
        </div>
      </header>

      {/* Banner: AnnualExpenses reference by section */}
      {sectionsWithRef.length > 0 && (
        <div className="glass p-6 rounded-[2rem] border border-accent/20 bg-accent/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Planned in Annual Expenses ({month})</h3>
            <Link to="/annual-expenses" className="text-[10px] font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all">View Full Worksheet →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {sectionsWithRef.map(sec => (
              <div key={sec.id} className="bg-tx-primary/5 p-4 rounded-2xl border border-border-base group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{sec.icon || '📂'}</span>
                  <span className="text-[10px] font-black text-tx-muted uppercase tracking-widest leading-tight">{sec.name}</span>
                </div>
                <div className="text-lg font-black text-tx-primary tabular-nums tracking-tighter">{fmt(refSection[sec.name])}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue summary alert if exists */}
      {totalRevenue > 0 && (
        <div className="p-4 bg-success/5 border border-success/10 rounded-2xl flex items-center gap-4">
           <span className="text-lg">💵</span>
           <p className="text-xs font-black text-success uppercase tracking-widest">
              Available capital this month: <span className="text-tx-primary ml-2">{fmt(totalRevenue)}</span>
           </p>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
         <div className="glass p-6 rounded-[2rem] border border-border-base space-y-1">
            <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">Operating Capital</div>
            <div className="text-2xl font-black text-success tabular-nums tracking-tighter">{fmt(totalRevenue || 0)}</div>
            <p className="text-[9px] font-bold text-tx-secondary uppercase tracking-tighter">{totalRevenue > 0 ? 'Verified from Revenues' : 'No records'}</p>
         </div>
         <div className="glass p-6 rounded-[2rem] border border-border-base space-y-1">
            <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">Assigned Limit</div>
            <div className="text-2xl font-black text-tx-primary tabular-nums tracking-tighter">{fmt(totalBudget)}</div>
            <p className="text-[9px] font-bold text-tx-secondary uppercase tracking-tighter">Sum of all categories</p>
         </div>
         <div className="glass p-6 rounded-[2rem] border border-border-base space-y-1">
            <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">Actual Expense</div>
            <div className="text-2xl font-black text-yellow tabular-nums tracking-tighter">{fmt(totalActual)}</div>
            <p className="text-[9px] font-bold text-tx-secondary uppercase tracking-tighter">Synced with Registry</p>
         </div>
         <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-1 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-700 ${balance < 0 ? 'bg-danger' : 'bg-success'}`}></div>
            <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">Net Remainder</div>
            <div className={`text-2xl font-black tabular-nums tracking-tighter ${balance < 0 ? 'text-danger animate-pulse' : 'text-success'}`}>{fmt(balance)}</div>
            <p className="text-[9px] font-bold text-tx-secondary uppercase tracking-tighter">{totalRevenue > 0 ? 'Revenue - Actual' : 'Limit - Actual'}</p>
         </div>
        <div className="glass p-6 rounded-[2rem] border border-border-base flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">Execution</div>
              <div className={`text-sm font-black tabular-nums ${pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-yellow' : 'text-success'}`}>{pct}%</div>
            </div>
           <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden mt-3">
              <div className={`h-full transition-all duration-1000 ${pct >= 100 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
           </div>
        </div>
      </div>

      {/* Main categories table */}
      <section className="glass rounded-[3rem] border border-border-base overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border-base flex items-center justify-between bg-border-base/10">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.2em]">Limit vs Actual Expense by Category</h3>
           </div>
           {!totalRevenue && (
             <Link to="/revenues" className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent hover:text-primary transition-all">
                Add Revenues to unlock metrics
             </Link>
           )}
        </div>

        {loading ? (
          <div className="p-20 flex justify-center opacity-30 animate-pulse font-black uppercase text-xs tracking-widest">
             Compiling category data...
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase text-tx-muted opacity-30 tracking-widest border-b border-border-base bg-tx-primary/[0.01]">
                  <th className="p-6 pl-10">Category</th>
                  <th className="p-6">Structure</th>
                  <th className="p-6">Set Limit</th>
                  <th className="p-6">Actual Expense</th>
                  <th className="p-6">Balance</th>
                  <th className="p-6">Execution</th>
                  {totalRevenue > 0 && <th className="p-6">% Revenue</th>}
                  <th className="p-6 pr-10 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {rows.map(row => {
                  const budgetVal = parseFloat(row.budget) || 0
                  const actualVal = parseFloat(row.actual_expense) || 0
                  const rowBal    = budgetVal > 0 ? budgetVal - actualVal : 0
                  const rowPct    = budgetVal > 0 ? Math.round(actualVal / budgetVal * 100) : 0
                  const pctRevenue = totalRevenue > 0 ? (actualVal / totalRevenue * 100).toFixed(1) : null
                  
                  const secObj  = getSection(row.section_id)
                  const seccion = secObj?.name || '—'
                  const refVal  = refSection[seccion] || 0
                  
                  return (
                    <tr key={row.id} className="hover:bg-tx-primary/[0.01] transition-colors group">
                      <td className="p-6 pl-10">
                        <span className="font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-wider">{row.category_name}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                           <span className="text-base grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{secObj?.icon || '📂'}</span>
                           <span className="text-[10px] font-bold text-tx-muted uppercase tracking-tighter truncate max-w-[120px]">{seccion}</span>
                           {refVal > 0 && <span className="text-[9px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20">Synced</span>}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 bg-tx-primary/5 border border-border-base rounded-xl px-4 py-2.5 w-36 focus-within:border-accent/40 transition-all">
                           <span className="text-tx-muted opacity-30 font-black text-xs">$</span>
                           <input
                            type="number" step="1000" value={row.budget || ''}
                            onChange={e => handleChange(row.id, 'budget', e.target.value)}
                            className="bg-transparent border-none text-tx-primary font-black w-full outline-none text-xs tabular-nums"
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="p-6">
                         <span className={`text-sm font-black tabular-nums ${actualVal > 0 ? 'text-yellow' : 'text-tx-muted opacity-30'}`}>{fmt(actualVal)}</span>
                      </td>
                      <td className={`p-6 text-sm font-black tabular-nums ${rowBal < 0 ? 'text-danger' : actualVal > 0 ? 'text-success' : 'text-tx-muted opacity-30'}`}>
                        {budgetVal > 0 ? (rowBal < 0 ? `(${fmt(Math.abs(rowBal))})` : fmt(rowBal)) : '—'}
                      </td>
                      <td className="p-6">
                         <div className="flex items-center gap-3 min-w-[140px]">
                            <div className="flex-1 h-1.5 bg-tx-primary/5 rounded-full overflow-hidden">
                               <div className={`h-full transition-all duration-1000 ${rowPct >= 100 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${Math.min(rowPct, 100)}%` }}></div>
                            </div>
                            <span className={`text-[11px] font-black tabular-nums w-8 text-right ${rowPct >= 100 ? 'text-danger' : 'text-tx-secondary'}`}>{rowPct}%</span>
                         </div>
                      </td>
                      {totalRevenue > 0 && (
                        <td className="p-6">
                           <span className="text-[11px] font-black text-tx-muted opacity-40 tabular-nums">{pctRevenue}%</span>
                        </td>
                      )}
                      <td className="p-6 text-right pr-10">
                        <button className="p-2.5 rounded-xl bg-tx-primary/5 text-tx-primary hover:bg-accent hover:text-primary transition-all disabled:opacity-30 flex items-center justify-center float-right" 
                                onClick={() => handleSave(row)} disabled={saving[row.id]}>
                          {saving[row.id] ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : '💾'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t-2 border-border-base bg-tx-primary/[0.02]">
                <tr className="font-black text-tx-primary uppercase tracking-widest text-xs">
                  <td className="p-8 pl-10" colSpan={2}>Aggregate Portfolio</td>
                  <td className="p-8">{fmt(totalBudget)}</td>
                  <td className="p-8 text-yellow">{fmt(totalActual)}</td>
                  <td className={`p-8 ${balance < 0 ? 'text-danger' : 'text-success'}`}>{fmt(balance)}</td>
                  <td className="p-8">
                     <span className={`px-4 py-1.5 rounded-xl border ${pct >= 100 ? 'border-danger text-danger bg-danger/5' : 'border-success text-success bg-success/5'}`}>
                        {pct}% Executed
                     </span>
                  </td>
                  {totalRevenue > 0 && <td className="p-8 opacity-40">{(totalActual / totalRevenue * 100).toFixed(1)}%</td>}
                  <td className="p-8 pr-10"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
