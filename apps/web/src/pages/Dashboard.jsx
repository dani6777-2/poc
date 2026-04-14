import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { MONTH_LABELS, MONTH_KEYS } from '../constants/finance'
import { recentMonths } from '../constants/time'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler)

const RECENT_MONTHS = recentMonths(12)
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const HealthScore = ({ score }) => {
  const color = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle className="text-tx-primary/5" cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" />
        <circle
          className="transition-all duration-1000 ease-out"
          cx="50" cy="50" r="42"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="transparent"
          style={{
            strokeDasharray: '263.9',
            strokeDashoffset: 263.9 - (263.9 * score) / 100,
            filter: `drop-shadow(0 0 12px ${color}66)`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-tx-primary leading-none tracking-tighter">{score}</span>
        <span className="text-[10px] text-tx-muted font-black uppercase tracking-[0.2em] mt-2 opacity-50">Score</span>
      </div>
    </div>
  );
}

const Skeleton = ({ className }) => <div className={`animate-pulse bg-tx-primary/5 rounded-[2rem] ${className}`} />;

export default function Dashboard() {
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [year, setYear]   = useState(new Date().getFullYear())
  const [analysis, setAnalysis] = useState(null)
  const [netData, setNetData]   = useState([])
  const [forecast, setForecast]   = useState(null)
  const [loading, setLoading]     = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [anlRes, netRes, aiRes] = await Promise.all([
        api.get(`/analysis/${month}`),
        api.get(`/expense-details/${year}/net`).catch(() => ({ data: [] })),
        api.get(`/ai/forecast/${month}`).catch(() => ({ data: null })),
      ])
      setAnalysis(anlRes.data)
      setNetData(netRes.data)
      setForecast(aiRes.data)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  const kpis = analysis?.kpis || {}

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 11, weight: '900' }, boxWidth: 10, usePointStyle: true } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        titleFont: { size: 14, weight: '900' },
        bodyFont: { size: 13 },
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
        cornerRadius: 16,
        callbacks: { label: ctx => ` ${fmt(ctx.raw)}` }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } }, grid: { display: false } },
      y: { ticks: { color: '#64748b', callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(148, 163, 184, 0.05)' } }
    }
  }

  const lineData = useMemo(() => ({
    labels: netData?.map(n => MONTH_LABELS[MONTH_KEYS.indexOf(n.month)]) || [],
    datasets: [
      {
        label: 'Revenues',
        data: netData?.map(n => n.revenues) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 4,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Expenses',
        data: netData?.map(n => n.expenses) || [],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.05)',
        borderWidth: 4,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#f43f5e',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      }
    ]
  }), [netData])

  return (
    <div className="page-entry pb-20 space-y-10">
      <PageHeader 
        title={<>Strategic Executive <span className="text-accent italic font-light">Dashboard</span></>}
        subtitle="Predictive financial analytics and capital management"
        badge="Enterprise Core Protocol 4.5"
        icon="🏦"
        actions={
          <div className="flex items-center gap-3">
             <div className="glass flex items-center p-1 rounded-2xl shadow-premium border border-border-base/40 bg-secondary/60">
                <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="bg-transparent border-none text-tx-primary font-black px-4 py-2 cursor-pointer outline-none text-xs uppercase tracking-widest"
                >
                {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
                </select>
                <span className="w-px h-6 bg-tx-primary/10 mx-1"></span>
                <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent border-none text-tx-primary font-black px-4 py-2 cursor-pointer outline-none text-xs uppercase tracking-widest"
                >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-secondary">{y}</option>)}
                </select>
            </div>
            <Link to="/analysis">
                <Button variant="accent" size="sm" className="px-6 font-black uppercase tracking-widest h-12 shadow-glow-accent">AI Panel</Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-56 md:col-span-2" />
          <Skeleton className="h-56" />
          <Skeleton className="h-[450px] md:col-span-3" />
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr] gap-8">
            <Card interactive className="p-10 flex items-center gap-10 border-none shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-30" />
              <HealthScore score={forecast?.health_score || 0} />
              <div className="flex flex-col gap-6 flex-1 border-l border-border-base/40 pl-10">
                <div className="space-y-1">
                  <label className="text-[10px] text-tx-muted font-black uppercase tracking-[0.3em] opacity-40 block">Savings Rate</label>
                  <strong className={`text-3xl font-black tabular-nums tracking-tighter transition-all ${(forecast?.savings_rate || 0) > 10 ? 'text-success' : 'text-warning'}`}>
                    {forecast?.savings_rate || 0}%
                  </strong>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-tx-muted font-black uppercase tracking-[0.3em] opacity-40 block">Projected Expense</label>
                  <strong className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter whitespace-nowrap drop-shadow-sm">
                    {fmt(forecast?.projected_expense)}
                  </strong>
                </div>
              </div>
            </Card>

            <Card interactive className="p-10 flex flex-col justify-between gap-6 border-none shadow-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-success/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />
              <div>
                <Badge variant="success" glow className="mb-4 px-4 py-1.5 font-black uppercase tracking-[0.3em] text-[9px]">Revenue Flow</Badge>
                <div className="text-4xl font-black text-success tabular-nums tracking-tighter drop-shadow-glow-success">{fmt(kpis.total_revenue)}</div>
              </div>
              <div className="border-t border-border-base/40 pt-6">
                <label className="text-[10px] uppercase text-tx-muted font-black tracking-[0.3em] mb-2 opacity-30 block">Operational Expense Rate</label>
                <div className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter">{fmt(kpis.actual_expense)}</div>
              </div>
              <div className="border-t border-border-base/40 pt-6 flex justify-between items-end">
                <div>
                   <label className="text-[10px] uppercase text-tx-muted font-black tracking-[0.3em] mb-2 opacity-30 block">Net Liquidity</label>
                   <div className={`text-3xl font-black tabular-nums tracking-tighter ${kpis.cash_balance < 0 ? 'text-danger drop-shadow-glow-danger' : 'text-accent-light drop-shadow-glow-accent'}`}>{fmt(kpis.cash_balance)}</div>
                </div>
                <Badge variant={kpis.cash_balance < 0 ? 'danger' : 'success'} className="mb-1 font-black uppercase tracking-widest text-[8px]">{kpis.cash_balance < 0 ? 'Deficit' : 'Surplus'}</Badge>
              </div>
            </Card>

            <Card interactive className="p-10 flex flex-col justify-center gap-8 border-none shadow-premium bg-linear-to-br from-secondary to-transparent">
              <h4 className="text-[11px] uppercase font-black text-tx-muted mb-2 tracking-[0.4em] opacity-40">AI Asset Location</h4>
              <div className="space-y-8">
                <div className="space-y-3.5">
                  <div className="text-[11px] flex justify-between font-black uppercase tracking-widest">
                    <span className="text-tx-secondary opacity-60">Essential Consumption</span>
                    <span className="text-tx-primary">{forecast?.kpis_detail?.essential_ratio || 0}%</span>
                  </div>
                  <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                    <div className="h-full bg-accent rounded-full shadow-glow-accent transition-all duration-1000" style={{ width: `${forecast?.kpis_detail?.essential_ratio || 0}%` }}></div>
                  </div>
                </div>
                <div className="space-y-3.5">
                  <div className="text-[11px] flex justify-between font-black uppercase tracking-widest">
                    <span className="text-tx-secondary opacity-60">Vulnerability</span>
                    <span className="text-tx-primary">{forecast?.kpis_detail?.vulnerability || 0}%</span>
                  </div>
                  <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                    <div className="h-full bg-purple rounded-full shadow-glow-purple transition-all duration-1000" style={{ width: `${forecast?.kpis_detail?.vulnerability || 0}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-tx-muted font-bold uppercase italic opacity-20 tracking-tighter leading-relaxed">Dataset synchronized with biometric prediction clusters.</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            <Card className="p-10 shadow-premium border-none">
              <div className="flex items-center justify-between mb-12 px-2">
                <div>
                  <h3 className="text-[13px] font-black text-tx-primary uppercase tracking-[0.4em]">Economic Flow Analytics</h3>
                  <p className="text-[11px] text-tx-muted font-bold uppercase tracking-widest mt-2 opacity-30">Historical trend of 12 cyclic periods</p>
                </div>
                <div className="flex gap-8 text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-50">
                  <span className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-success shadow-glow-success"></span> Inflow</span>
                  <span className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-danger shadow-glow-danger"></span> Outflow</span>
                </div>
              </div>
              <div className="h-[420px] w-full">
                <Line data={lineData} options={chartOptions} />
              </div>
            </Card>

            <Card className="p-10 flex flex-col min-h-[520px] bg-linear-to-b from-tx-primary/[0.03] to-transparent shadow-premium border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center justify-between mb-10 px-2 relative z-10">
                <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.4em]">FinOps Intelligence</h3>
                <Badge variant="purple" glow className="animate-pulse px-4 font-black uppercase tracking-widest text-[8px]">Synchronous Node</Badge>
              </div>
              <div className="flex-1 space-y-5 relative z-10">
                {forecast?.insights?.map((ins, i) => (
                  <div key={i} className={`flex gap-5 p-6 rounded-3xl border-l-8 transition-all duration-500 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.06] shadow-xl group/ins ${ins.type === 'warning' ? 'border-danger' : ins.type === 'success' ? 'border-success' : 'border-accent'}`}>
                    <div className="text-3xl group-hover/ins:scale-110 transition-transform">{ins.type === 'warning' ? '⚠️' : ins.type === 'success' ? '✅' : 'ℹ️'}</div>
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-black text-tx-primary leading-tight uppercase tracking-tight group-hover/ins:text-accent transition-colors">{ins.message}</div>
                      <div className="text-[11px] text-tx-muted font-black uppercase tracking-[0.2em] opacity-40">{ins.value}</div>
                    </div>
                  </div>
                ))}
                {!forecast?.insights?.length && (
                  <div className="mt-28 flex flex-col items-center gap-6 opacity-20 grayscale">
                    <span className="text-6xl filter drop-shadow-glow">📡</span>
                    <p className="text-center text-[11px] font-black uppercase tracking-[0.5em] italic max-w-[200px] leading-loose">No anomalies detected in the last audit window</p>
                  </div>
                )}
              </div>
              <Link to="/health" className="mt-10 relative z-10">
                <Button className="w-full py-6 rounded-[1.5rem] uppercase font-black tracking-[0.3em] text-[11px] shadow-glow-accent" variant="primary">Full Health Diagnosis →</Button>
              </Link>
            </Card>
          </div>

          <Card className="p-12 shadow-premium border-none relative overflow-hidden">
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-12 px-4 relative z-10">
              <div className="space-y-1">
                 <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">Active Portfolio Categories</h3>
                 <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest opacity-30">Capital distribution by operating segment</p>
              </div>
              <Link to="/budget">
                <Button variant="ghost" size="sm" className="font-black uppercase tracking-[0.2em] text-[10px] opacity-40 hover:opacity-100 hover:text-accent">Manage Ceilings →</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 relative z-10">
              {analysis?.category_chart?.slice(0, 8).map(c => {
                 const ratio = c.budget > 0 ? (c.actual / c.budget) * 100 : 0
                 return (
                    <div key={c.category} className="bg-tx-primary/[0.03] p-6 rounded-[2rem] border border-border-base/40 space-y-5 transition-all hover:bg-tx-primary/[0.08] hover:-translate-y-1 group group/cat shadow-lg">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-tx-muted uppercase tracking-widest group-hover/cat:text-accent transition-colors truncate pr-2 opacity-50">{c.category}</span>
                        <div className="flex justify-between items-end">
                            <span className="text-xl font-black text-tx-primary tabular-nums tracking-tighter group-hover/cat:text-tx-primary transition-colors">{fmt(c.actual)}</span>
                            <span className={`text-[10px] font-black tabular-nums transition-colors ${ratio > 100 ? 'text-danger' : 'text-tx-muted'}`}>{ratio.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                        <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${Math.min(ratio, 100)}%`, background: ratio > 100 ? '#ef4444' : '#6366f1', boxShadow: `0 0 10px ${ratio > 100 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }}></div>
                    </div>
                    </div>
                 )
              })}
              {(!analysis?.category_chart || analysis.category_chart.length === 0) && (
                 <div className="col-span-full py-20 text-center opacity-20 grayscale uppercase font-black tracking-[0.4em] text-xs">No data segmentation available</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
