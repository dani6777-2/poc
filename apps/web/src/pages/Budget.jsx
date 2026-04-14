import { useState, useEffect, useCallback, useMemo } from 'react'
import { financeService, analysisService } from '../services'
import { RECENT_MONTHS } from '../constants/time'
import { fmt } from '../utils/formatters'
import { useFinance } from '../context/FinanceContext'

// Atoms & Molecules
import Card from '../components/atoms/Card'

// Organisms
import AnnualPlanningBanner from '../components/organisms/AnnualPlanningBanner'
import BudgetKpiGrid from '../components/organisms/BudgetKpiGrid'
import BudgetLimitTable from '../components/organisms/BudgetLimitTable'

export default function Budget() {
  const { sections, getSection } = useFinance()
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

      <AnnualPlanningBanner 
        sectionsWithRef={sectionsWithRef}
        refSection={refSection}
        month={month}
        fmt={fmt}
      />

      {totalRevenue > 0 && (
        <div className="p-4 bg-success/5 border border-success/10 rounded-2xl flex items-center gap-4">
           <span className="text-lg">💵</span>
           <p className="text-xs font-black text-success uppercase tracking-widest">
              Available capital this month: <span className="text-tx-primary ml-2">{fmt(totalRevenue)}</span>
           </p>
        </div>
      )}

      <BudgetKpiGrid 
        totalRevenue={totalRevenue}
        totalBudget={totalBudget}
        totalActual={totalActual}
        balance={balance}
        pct={pct}
        fmt={fmt}
      />

      <BudgetLimitTable 
        rows={rows}
        loading={loading}
        saving={saving}
        totalRevenue={totalRevenue}
        totalBudget={totalBudget}
        totalActual={totalActual}
        balance={balance}
        pct={pct}
        getSection={getSection}
        refSection={refSection}
        handleChange={handleChange}
        handleSave={handleSave}
        fmt={fmt}
      />
    </div>
  )
}
