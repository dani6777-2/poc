import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { analysisService } from '../services'
import { recentMonths } from '../constants/time'
import { useTheme } from '../context/ThemeContext'
import { useFinance } from '../context/FinanceContext'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const RECENT_MONTHS = recentMonths(12)
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const NIVEL_COLOR = {
  ok:      '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  no_data: '#64748b',
}

const NIVEL_ICON = { ok: '🟢', warning: '🟡', danger: '🔴', no_data: '⚪' }

export default function Analysis() {
  const { getSection } = useFinance()
  const [month, setMonth]     = useState(RECENT_MONTHS[0])
  const [data, setData]   = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      analysisService.getAnalysis(month),
      analysisService.getHealthAlerts(month).catch(() => null),
    ])
      .then(([anlData, healthData]) => {
        setData(anlData)
        setHealth(healthData)
      })
      .finally(() => setLoading(false))
  }, [month])

  const kpis = data?.kpis || {}
  const planVsReal = data?.plan_vs_actual || []
  const hasPlanVsActual = planVsReal.some(r => r.planned > 0 || r.actual > 0)

  // Map health by section for fast access
  const healthMap = useMemo(() => {
    const map = {}
    if (health?.sections) {
      health.sections.forEach(s => { map[s.section] = s })
    }
    return map
  }, [health])

  // Plan vs Actual Chart
  const pvr = useMemo(() => planVsReal.filter(r => r.planned > 0 || r.actual > 0), [planVsReal])
  
  const barPvrData = {
    labels: pvr.map(r => r.section),
    datasets: [
      {
        label: 'Planned',
        data: pvr.map(r => r.planned),
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderColor: '#6366f1', borderWidth: 2, borderRadius: 8,
      },
      {
        label: 'Actual Execution',
        data: pvr.map(r => r.actual),
        backgroundColor: pvr.map(r => {
          const s = healthMap[r.section]
          const c = s ? NIVEL_COLOR[s.level] : '#10b981'
          return `${c}44`
        }),
        borderColor: pvr.map(r => {
          const s = healthMap[r.section]
          return s ? NIVEL_COLOR[s.level] : '#10b981'
        }),
        borderWidth: 2, borderRadius: 8,
      }
    ]
  }

  // Channels Chart
  const channelsChart = {
    labels: data?.channels?.map(c => c.channel) || [],
    datasets: [{
      label: 'Total Spend ($)',
      data: data?.channels?.map(c => c.total) || [],
      backgroundColor: [
        'rgba(99,102,241,0.4)', 'rgba(16,185,129,0.4)', 'rgba(245,158,11,0.4)',
        'rgba(239,68,68,0.4)', 'rgba(139,92,246,0.4)', 'rgba(59,130,246,0.4)', 'rgba(20,184,166,0.4)'
      ],
      borderColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#14b8a6'],
      borderWidth: 2, borderRadius: 8,
    }]
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: theme === 'dark' ? '#94a3b8' : '#475569', font: { size: 10, weight: '900' }, boxWidth: 12 } },
      tooltip: { 
        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        titleFont: { size: 12, weight: '900' },
        bodyFont: { size: 12 },
        padding: 16,
        cornerRadius: 16,
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
        callbacks: { label: ctx => ` ${fmt(ctx.raw)}` } 
      }
    },
    scales: {
      x: { 
        ticks: { color: '#64748b', font: { size: 9, weight: 'bold' } }, 
        grid: { display: false } 
      },
      y: { 
        ticks: { color: '#64748b', callback: v => fmt(v), font: { size: 9 } }, 
        grid: { color: 'rgba(148, 163, 184, 0.05)' } 
      }
    }
  }

  return (
    <div className="page-entry pb-20 space-y-10">
      <PageHeader 
        title={<>Financial <span className="text-accent italic font-light">Analytics</span></>}
        subtitle="Distributed intelligence and advanced consumption patterns"
        icon="📊"
        badge={`Analysis Cycle ${month} Active`}
        actions={
          <div className="glass p-1 rounded-xl">
            <select 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
            >
              {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
           <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Processing data vectors...</p>
        </div>
      ) : (
        <>
          {/* ── Global Health Banner ── */}
          {health && !health.no_revenue && (
            <Card className="p-8 overflow-hidden relative group border-none shadow-2xl" glow={health.global_level !== 'ok'}>
              <div 
                 className="absolute top-0 right-0 w-96 h-96 opacity-[0.05] -translate-y-1/2 translate-x-1/2 rounded-full blur-[100px] pointer-events-none" 
                 style={{ backgroundColor: NIVEL_COLOR[health.global_level] }} 
              />
              
              <div className="relative flex flex-col md:flex-row items-center gap-10">
                <div className="text-6xl font-black tabular-nums tracking-tighter" style={{ color: NIVEL_COLOR[health.global_level] }}>
                  {health.global_score}<span className="text-2xl opacity-40">%</span>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <Badge variant={health.global_level === 'ok' ? 'success' : health.global_level === 'warning' ? 'warning' : 'danger'} glow className="mb-3 px-4 py-1.5">
                    {health.global_level === 'ok' ? 'STATUS: OPTIMIZED' : health.global_level === 'warning' ? 'ALERT DETECTED' : 'CRITICAL RISK'}
                  </Badge>
                  <p className="text-tx-secondary text-[14px] font-medium leading-relaxed max-w-xl">
                    {health.active_alerts > 0 
                      ? `Attention: ${health.active_alerts} critical deviations have been detected in your spending ceilings that require immediate intervention.` 
                      : 'Excellent: Your spending architecture operates within the efficiency parameters defined for this period.'}
                  </p>
                </div>

                <div className="w-full md:w-64 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-tx-muted">
                     <span>Operational Efficiency</span>
                     <span>{health.global_score}%</span>
                  </div>
                  <div className="h-2.5 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-glow" 
                      style={{ width: `${health.global_score}%`, backgroundColor: NIVEL_COLOR[health.global_level], boxShadow: `0 0 15px ${NIVEL_COLOR[health.global_level]}44` }} 
                    />
                  </div>
                </div>

                <Link to="/health">
                  <Button variant="ghost" className="whitespace-nowrap">Full Audit →</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ── KPIs Matrix ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <Card interactive className="p-6 border-t-2 border-success/20">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">Total Revenue</label>
              <div className="text-2xl font-black text-success tabular-nums">{fmt(kpis.total_revenue)}</div>
              <Link to="/revenues" className="inline-block mt-4 text-[9px] font-black text-accent-light hover:underline uppercase tracking-widest opacity-60">View Matrix →</Link>
            </Card>

            <Card interactive className="p-6 border-t-2 border-border-base">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">Budget</label>
              <div className="text-2xl font-black text-tx-primary tabular-nums">{fmt(kpis.planned_expense)}</div>
              <div className="text-[9px] font-black text-tx-muted mt-2 opacity-30 uppercase">From Annual Planner</div>
            </Card>

            <Card interactive className="p-6 border-t-2 border-warning/20">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">Actual Expense (Cash)</label>
              <div className="text-2xl font-black text-warning tabular-nums">{fmt(kpis.actual_expense)}</div>
              <div className="text-[9px] font-black text-warning/40 mt-2 uppercase">Cash Settlement</div>
            </Card>

            <Card interactive className="p-6 border-t-2 border-accent/20">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">Monthly Variance</label>
              <div className={`text-2xl font-black tabular-nums ${kpis.cash_balance < 0 ? 'text-danger' : 'text-success'}`}>
                {fmt(kpis.cash_balance)}
              </div>
              <div className="text-[9px] font-black text-tx-muted mt-2 opacity-30 uppercase">
                {kpis.projected_balance !== undefined && `Net Card: ${fmt(kpis.projected_balance)}`}
              </div>
            </Card>

            <Card interactive className="p-6 border-t-2 border-purple/20 col-span-2 lg:col-span-1">
              <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.2em] block mb-2 opacity-50">Consumption Rate</label>
              <div className="space-y-3">
                <div className={`text-2xl font-black tabular-nums ${kpis.executed_pct >= 100 ? 'text-danger' : kpis.executed_pct >= 80 ? 'text-warning' : 'text-purple'}`}>
                  {kpis.executed_pct}%
                </div>
                <div className="h-1.5 bg-tx-primary/5 rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-1000 ${kpis.executed_pct >= 100 ? 'bg-danger shadow-glow-danger' : 'bg-purple shadow-glow-purple'}`} 
                    style={{ width: `${Math.min(kpis.executed_pct || 0, 100)}%` }} 
                   />
                </div>
              </div>
            </Card>
          </div>

          {/* ── CARD BANNER ── */}
          {kpis.has_card && kpis.month_card_expense > 0 && (
            <Card border={false} className="p-6 bg-warning/5 border-l-4 border-warning flex flex-col md:flex-row items-center gap-6">
              <div className="text-3xl">💳</div>
              <div className="flex-1">
                <h5 className="text-[13px] font-black text-warning uppercase tracking-widest leading-none">Projected Deferred Debt: {fmt(kpis.month_card_expense)}</h5>
                <p className="text-[11px] text-tx-secondary font-medium mt-2 opacity-60">
                   This volume has been diverted to the <span className="text-tx-primary font-bold">{kpis.card_channel}</span> channel. Remaining immediate liquidity: <span className="text-success font-black">{fmt(kpis.cash_balance)}</span>.
                </p>
              </div>
              <Link to="/card">
                <Button size="sm" variant="warning" className="px-6">View Card Management</Button>
              </Link>
            </Card>
          )}

          {/* ── STRUCTURAL COMPARATIVE ── */}
          <Card className="overflow-hidden border border-border-base shadow-premium">
            <div className="p-8 border-b border-border-base bg-tx-primary/[0.01] flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                  <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.25em]">Planned vs Actual by Vertical</h3>
                  <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest mt-1 opacity-40">Detailed analysis of structural deviations</p>
               </div>
               <div className="flex gap-4">
                 <Link to="/health"><Button variant="ghost" size="sm" className="text-[11px]">🏥 Full Health</Button></Link>
                 <Link to="/annual-expenses"><Button variant="ghost" size="sm" className="text-[11px]">📋 Roadmap</Button></Link>
               </div>
            </div>

            <div className="p-0">
              {hasPlanVsActual ? (
                <>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[9px] font-black uppercase tracking-[0.3em] text-tx-muted opacity-40 bg-tx-primary/[0.02] border-b border-border-base">
                          <th className="p-6 pl-10">Cost Unit</th>
                          <th className="p-6 text-right w-40">Master Plan</th>
                          <th className="p-6 text-right w-40">Actual Expense</th>
                          <th className="p-6 text-right w-40">Delta Vector</th>
                          <th className="p-6 text-center w-48">Audit Status</th>
                          {health && !health.no_revenue && <th className="p-6 text-center w-32">Rev. Ratio</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base">
                        {pvr.map(r => {
                          const over   = r.variance < 0
                          const under    = r.variance > 0
                          const sSec = healthMap[r.section]
                          const nColor  = sSec ? NIVEL_COLOR[sSec.level] : null

                          return (
                            <tr key={r.section} className="hover:bg-tx-primary/[0.01] transition-colors group">
                              <td className="p-5 pl-10 border-l-4 transition-all" style={{ borderLeftColor: nColor || 'transparent' }}>
                                <div className="text-sm font-bold text-tx-primary group-hover:translate-x-1 transition-transform">{r.section}</div>
                              </td>
                              <td className="p-5 text-right tabular-nums text-sm font-bold text-tx-muted">
                                {r.planned > 0 ? fmt(r.planned) : <span className="opacity-20">—</span>}
                              </td>
                              <td className="p-5 text-right tabular-nums">
                                <span className={`text-sm font-black ${r.actual > 0 ? 'text-warning' : 'text-tx-muted opacity-20'}`}>
                                  {r.actual > 0 ? fmt(r.actual) : '—'}
                                </span>
                              </td>
                              <td className={`p-5 text-right tabular-nums text-sm font-black ${over ? 'text-danger' : under ? 'text-success' : 'text-tx-muted'}`}>
                                {r.planned > 0 && r.actual > 0 ? (
                                  <div className="flex items-center justify-end gap-1.5 underline decoration-2 decoration-current/10 underline-offset-4">
                                    <span className="text-[10px] opacity-40">{over ? '▲' : '▼'}</span>
                                    {fmt(Math.abs(r.variance))}
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="p-5">
                                <div className="flex justify-center">
                                  {r.planned > 0 && r.actual > 0 ? (
                                    <Badge variant={over ? 'danger' : 'success'} className="px-4">
                                      {over ? `${((r.actual - r.planned) / r.planned * 100).toFixed(0)}% EXCESS` : 'BALANCED'}
                                    </Badge>
                                  ) : r.actual > 0 ? (
                                    <Badge variant="warning" className="px-4">OFF PLAN</Badge>
                                  ) : (
                                    <span className="text-[9px] font-black text-tx-muted opacity-20 tracking-widest uppercase">STABLE</span>
                                  )}
                                </div>
                              </td>
                              {health && !health.no_revenue && (
                                <td className="p-5 text-center">
                                  {sSec && sSec.level !== 'no_data' ? (
                                    <div className="flex flex-col items-center gap-1" title={sSec.advice}>
                                      <span className="text-sm">{NIVEL_ICON[sSec.level]}</span>
                                      <span className="text-[10px] font-black" style={{ color: nColor }}>{sSec.revenue_pct}%</span>
                                    </div>
                                  ) : <span className="text-tx-muted opacity-20">—</span>}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-tx-primary/5 text-sm group font-black">
                          <td className="p-6 pl-10 text-tx-primary tracking-[0.2em] uppercase">Aggregate Metrics</td>
                          <td className="p-6 text-right tabular-nums text-tx-primary/40">{fmt(pvr.reduce((s, r) => s + r.planned, 0))}</td>
                          <td className="p-6 text-right tabular-nums text-warning text-lg drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            {fmt(pvr.reduce((s, r) => s + r.actual, 0))}
                          </td>
                          <td colSpan="3" className="p-6"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Dynamic Alerts */}
                  {health && health.active_alerts > 0 && (
                    <div className="p-8 bg-danger/[0.02] border-y border-danger/10 flex flex-col gap-5">
                      <div className="flex items-center gap-3 text-danger font-black uppercase text-[10px] tracking-[0.25em]">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-danger"></span>
                        </span>
                        Active Strategic Deviations
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        {health.sections.filter(s => s.level !== 'ok' && s.level !== 'no_data').map(s => (
                          <div key={s.section} className="px-5 py-3 rounded-2xl bg-secondary/50 border border-border-base flex items-center gap-4 hover:border-danger/30 transition-all cursor-help" title={s.advice}>
                            <span className="text-lg">{NIVEL_ICON[s.level]}</span>
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black text-tx-primary uppercase tracking-tight">{s.section}</span>
                               <span className="text-[10px] font-black text-danger/80">{s.revenue_pct}% Actual <span className="opacity-30">/</span> {s.max_ok || s.min_ok}% Target</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Chart */}
                  <div className="p-10 h-[380px]">
                    <Bar data={barPvrData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            ...chartOptions.plugins.tooltip.callbacks,
                            afterLabel: ctx => {
                              if (ctx.datasetIndex === 1) {
                                const sec = healthMap[pvr[ctx.dataIndex]?.section]
                                return sec ? `Performance Index: ${sec.level.toUpperCase()}` : ''
                              }
                              return ''
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </>
              ) : (
                <div className="p-40 flex flex-col items-center justify-center text-center opacity-30 gap-6">
                  <div className="text-6xl text-tx-muted/20">📉</div>
                  <div className="space-y-2">
                    <p className="text-lg font-black text-tx-primary uppercase tracking-widest">Undefined Structure</p>
                    <p className="text-sm font-medium text-tx-secondary max-w-sm">No structural projection has been detected for this time period.</p>
                  </div>
                  <Link to="/annual-expenses"><Button variant="accent" className="mt-4">Configure Projection</Button></Link>
                </div>
              )}
            </div>
          </Card>

          {/* ── LOWER SECTION: Channels and Inflation Radar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="p-8 space-y-8 shadow-premium border border-border-base">
                <div>
                   <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Capital Segmentation
                   </h3>
                </div>
                
                {data?.channels?.length > 0 ? (
                  <div className="space-y-8">
                    <div className="h-[220px]">
                      <Bar data={channelsChart} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="text-[9px] text-tx-muted uppercase font-black tracking-widest bg-tx-primary/[0.02] border-y border-border-base">
                          <tr>
                            <th className="py-4 px-5">Operator / Channel</th>
                            <th className="py-4 px-5 text-right w-32">Volume</th>
                            <th className="py-4 px-5 text-center w-24">Relative</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base">
                           {data.channels.map(c => (
                             <tr key={c.channel} className="hover:bg-tx-primary/[0.01] transition-colors group">
                               <td className="py-4 px-5 flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channelsChart.datasets[0].borderColor[data.channels.indexOf(c) % 7] }} />
                                  <span className="text-xs font-bold text-tx-secondary group-hover:text-tx-primary transition-colors">{c.channel}</span>
                                  <span className="text-[9px] font-black text-accent-light opacity-30">/ {c.transactions_count} ops</span>
                                </td>
                               <td className="py-4 px-5 text-right tabular-nums text-sm font-black text-tx-primary">{fmt(c.total)}</td>
                               <td className="py-4 px-5 text-center">
                                  <Badge variant="muted" className="font-black tabular-nums">{c.pct}%</Badge>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 gap-4 grayscale">
                     <span className="text-5xl">🏪</span>
                     <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No processed transactions <br/> by integrated channels</p>
                  </div>
                )}
             </Card>

             <Card className="p-8 space-y-8 relative overflow-hidden shadow-premium border border-border-base">
                <div 
                  className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 animate-pulse pointer-events-none" 
                />
                
                <div>
                   <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> Inflation Radar
                   </h3>
                   <p className="text-[10px] text-tx-muted font-bold uppercase mt-1 opacity-40 tracking-wider">Historical deviation metric in consumption assets</p>
                </div>

                {data?.inflation?.length > 0 ? (
                  <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left table-fixed min-w-[360px]">
                      <thead>
                        <tr className="text-[9px] font-black uppercase text-tx-muted/30 tracking-[0.25em] border-b border-border-base">
                          <th className="pb-4 w-1/2">Asset / SKU</th>
                          <th className="pb-4 text-right">Reference</th>
                          <th className="pb-4 text-right pr-4">Volatility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-base">
                        {data.inflation.map((item, i) => (
                          <tr key={i} className="group hover:bg-tx-primary/[0.01] transition-colors">
                            <td className="py-4">
                               <div className="text-xs font-black text-tx-primary group-hover:text-tx-primary truncate transition-colors">{item.name}</div>
                               <div className="text-[9px] text-tx-muted font-bold uppercase opacity-30 mt-0.5">Base Hist: {fmt(item.prev_month_price)}</div>
                            </td>
                            <td className="py-4 text-right tabular-nums text-xs font-black text-tx-secondary">{fmt(item.current_price)}</td>
                            <td className="py-4 text-right pr-4 tabular-nums">
                               <div className={`text-xs font-black inline-flex items-center gap-1.5 ${item.variation_pct > 0 ? 'text-danger' : 'text-success'}`}>
                                  {item.variation_pct > 0 ? '▲' : '▼'}
                                  {Math.abs(item.variation_pct).toFixed(1)}%
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-5 grayscale pt-10">
                     <div className="w-12 h-12 rounded-full border border-border-base flex items-center justify-center text-xl shadow-inner">📡</div>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] max-w-[240px] text-center leading-relaxed">Insufficient historical reference <br/> for inflationary radar</p>
                  </div>
                )}
             </Card>
          </div>
        </>
      )}
    </div>
  )
}
