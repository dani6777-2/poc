import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { NIVEL_CFG } from '../constants/finance'
import { recentMonths } from '../constants/time'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'

const MESES = recentMonths(12)
const fmt = n => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)

function ScoreGauge({ score, level }) {
  const cfg   = NIVEL_CFG[level] || NIVEL_CFG.ok
  const angle = (score / 100) * 180   // semicircle 0→180°
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Critical'

  return (
    <div className="text-center py-6 flex flex-col items-center">
      <div className="relative">
        <svg width="240" height="130" viewBox="0 0 200 110" className="overflow-visible">
          {/* Track background */}
          <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-tx-primary/5" />
          {/* Score arc */}
          <path d={describeArc(100, 100, 80, 0, angle)} fill="none" stroke={cfg.color} strokeWidth="14" strokeLinecap="round" className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 12px ${cfg.color}88)` }} />
          {/* Center text */}
          <text x="100" y="85" textAnchor="middle" fill="currentColor" className="text-[36px] font-black text-tx-primary drop-shadow-sm">{score}%</text>
        </svg>
      </div>
      <Badge variant={level === 'ok' ? 'success' : level === 'warning' ? 'warning' : 'danger'} glow className="mt-4 px-6 tracking-[0.3em] uppercase font-black text-[10px]">
        DIAGNOSIS: {label.toUpperCase()}
      </Badge>
    </div>
  )
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = a => (a - 180) * Math.PI / 180
  const start = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) }
  const end   = { x: cx + r * Math.cos(toRad(endAngle)),   y: cy + r * Math.sin(toRad(endAngle)) }
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x},${start.y} A ${r},${r} 0 ${large},1 ${end.x},${end.y}`
}

function ReglaBarra({ label, icon, pct, meta, level, total }) {
  const cfg  = NIVEL_CFG[level] || NIVEL_CFG.no_data
  const fill = pct !== null ? Math.min((pct / (meta * 1.5)) * 100, 100) : 0
  return (
    <div className="mb-8 group">
      <div className="flex justify-between items-end mb-4 px-1">
        <div className="flex flex-col gap-1">
          <span className="font-black text-[11px] uppercase tracking-widest text-tx-primary flex items-center gap-3">
            <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span> {label}
          </span>
          {pct !== null && <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">{fmt(total)} consumed</span>}
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className="flex items-center gap-4">
              <span className="text-2xl font-black tabular-nums tracking-tighter" style={{ color: cfg.color }}>{pct !== null ? `${pct}%` : '—'}</span>
              <Badge variant={level === 'ok' ? 'success' : level === 'warning' ? 'warning' : 'danger'} size="sm" className="px-3 font-black">{cfg.label.replace('✓ ', '').replace('⚠ ', '').replace('🚨 ', '')}</Badge>
           </div>
           <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.4em] opacity-30">Reference Pt: {meta}%</span>
        </div>
      </div>
      <div className="h-2.5 bg-tx-primary/5 rounded-full overflow-hidden relative p-[1px]">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out shadow-premium" 
          style={{ width: `${fill}%`, background: cfg.color, boxShadow: `0 0 20px ${cfg.color}44` }} 
        />
        {/* Meta marker */}
        <div className="absolute top-0 w-1 h-full bg-tx-primary/10 shadow-glow transition-all duration-700" style={{ left: `${(1 / 1.5) * 100}%` }} />
      </div>
    </div>
  )
}

function SectionCard({ sec }) {
  const cfg = NIVEL_CFG[sec.level] || NIVEL_CFG.no_data
  const pct = sec.revenue_pct
  const maxRef = sec.invert ? (sec.min_ok || 20) : (sec.max_ok || 100)
  const isHealthy = sec.invert ? (pct >= maxRef) : (pct <= maxRef)

  return (
    <Card interactive border={false} className="p-8 group shadow-premium relative overflow-hidden transition-all hover:-translate-y-1" 
          style={{ borderTop: `4px solid ${cfg.color}` }}>
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-10 transition-all blur-3xl pointer-events-none" 
        style={{ backgroundColor: cfg.color }} 
      />
      
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
             <span className="text-4xl drop-shadow-md grayscale group-hover:grayscale-0 transition-all duration-500">{sec.icon}</span>
             <h4 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.25em]">{sec.section}</h4>
          </div>
          <Badge variant="muted" size="sm" className="w-fit mt-3 opacity-60 tracking-[0.3em] font-black uppercase text-[8px]">Protocol {sec.level.toUpperCase()}</Badge>
        </div>
        <div className="text-3xl filter drop-shadow-sm">{cfg.icon}</div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="text-5xl font-black tabular-nums tracking-tighter transition-transform group-hover:scale-110 origin-left" style={{ color: cfg.color }}>
            {pct !== null ? `${pct}%` : '—'}
          </div>
          <div className="text-right">
             <div className="text-[9px] font-black text-tx-muted uppercase tracking-widest leading-none opacity-40 mb-1">Market Ref.</div>
             <div className="text-[11px] font-black text-tx-primary uppercase tracking-tighter">{sec.reference}</div>
          </div>
        </div>

        <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
          {pct !== null && (
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((pct / (maxRef * 1.5)) * 100, 100)}%`, backgroundColor: cfg.color, boxShadow: `0 0 15px ${cfg.color}33` }} 
            />
          )}
        </div>
        
        <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">{fmt(sec.expense)} assigned</p>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isHealthy ? 'text-success' : 'text-danger'} opacity-80`}>
                <span className="text-sm">{isHealthy ? '✓' : '⚠'}</span> {isHealthy ? 'Sustainable' : 'Deviated'}
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border-base relative">
        <div className={`text-[12px] font-medium leading-relaxed ${sec.level === 'no_data' ? 'text-tx-muted italic opacity-30 text-[11px]' : ''}`} 
           style={{ color: sec.level === 'no_data' ? undefined : cfg.color }}>
          {sec.level === 'no_data' ? 'Database without active records for this period' : sec.advice}
        </div>
      </div>
    </Card>
  )
}

export default function SaludFinanciera() {
  const [month, setMonth]   = useState(MESES[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/health/alerts/${month}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [month])

  const score  = data?.global_score || 0
  const level  = data?.global_level || 'no_data'
  const rule   = data?.rule_50_30_20 || {}
  const card   = data?.card

  const sections       = data?.sections || []
  const danger_secs     = sections.filter(s => s.level === 'danger')
  const warning_secs    = sections.filter(s => s.level === 'warning')
  const ok_secs         = sections.filter(s => s.level === 'ok')
  const nodata_secs     = sections.filter(s => s.level === 'no_data')

  return (
    <div className="page-entry pb-20 space-y-10 group">
      <PageHeader 
        title={<>Strategic <span className="text-accent italic font-light">Control Panel</span></>}
        subtitle="Sustainability analytics and capital resilience"
        icon="🛡️"
        badge="Health Core Protocol V4.5"
        actions={
          <div className="glass p-1 rounded-xl">
            <select 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="bg-transparent border-none text-tx-primary font-bold px-4 py-2 cursor-pointer outline-none text-sm"
            >
              {MESES.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
            </select>
          </div>
        }
      />

      {data?.no_revenue && (
        <Card border={false} className="p-8 bg-warning/5 border-l-4 border-warning flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 shadow-premium">
          <div className="text-5xl drop-shadow-glow-warning animate-pulse">⚠️</div>
          <div className="flex-1 space-y-1">
             <h5 className="text-[14px] font-black text-warning uppercase tracking-[0.2em] leading-none">Revenue Baseline Missing</h5>
             <p className="text-[12px] text-tx-secondary font-medium opacity-60 leading-relaxed max-w-2xl">
                Percent saturation and operational efficiency calculations require a validated taxable base for this fiscal cycle.
             </p>
          </div>
          <Link to="/ingresos">
            <Button variant="warning" size="sm" className="px-8 font-black uppercase tracking-[0.2em] h-12 shadow-glow-warning">Register Revenue</Button>
          </Link>
        </Card>
      )}

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-4 animate-pulse">
           <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
           <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">Compiling biometric diagnosis...</p>
        </div>
      ) : (
        <>
          {/* ── Score + Rule 50/30/20 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">
            <Card className="p-10 flex flex-col items-center justify-center gap-12 relative overflow-hidden group shadow-premium border-none">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
              <ScoreGauge score={score} level={level} />
              
              <div className="w-full space-y-5 pt-10 border-t border-border-base relative">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">Active Deviations</span>
                  <span className={`text-3xl font-black tabular-nums tracking-tighter transition-all ${data?.active_alerts > 0 ? 'text-danger drop-shadow-glow-danger scale-110' : 'text-success'}`}>
                    {data?.active_alerts || 0}
                  </span>
                </div>
                <div className="flex items-baseline justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em]">Optimized Sectors</span>
                  <span className="text-lg font-black text-success tabular-nums">{ok_secs.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-12 relative overflow-hidden shadow-premium border-none">
              <div className="flex items-center gap-4 mb-14">
                <div className="w-2 h-7 bg-accent rounded-full shadow-glow-accent" />
                <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">Health Protocol 50/30/20</h3>
              </div>
              
              <div className="space-y-4">
                {Object.entries(rule).map(([key, g]) => (
                  <ReglaBarra key={key} label={g.label} icon={g.icon} pct={g.pct} meta={g.meta} level={g.level} total={g.total} />
                ))}
              </div>
              
              <div className="mt-14 pt-12 border-t border-border-base flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] opacity-30 block">Total Actual Period Spending</label>
                   <div className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter drop-shadow-sm">{fmt(data?.cash_expense + data?.card_expense_total)}</div>
                </div>
                <p className="text-[10px] text-tx-muted italic font-bold max-w-[480px] text-right leading-relaxed opacity-20 uppercase tracking-[0.1em]">
                  Audit algorithm based on high-fidelity heritage planning international standards.
                </p>
              </div>
            </Card>
          </div>

          {/* ── CARD Alert ── */}
          {card && (
            <Card border={false} className="p-10 shadow-premium transition-all hover:scale-[1.005] group border-none relative overflow-hidden" 
                  style={{ backgroundColor: `${NIVEL_CFG[card.level].color}05` }}>
              <div className="absolute left-0 top-0 w-1.5 h-full" style={{ backgroundColor: NIVEL_CFG[card.level].color }} />
              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="w-28 h-28 rounded-[2.5rem] bg-tx-primary/5 flex items-center justify-center text-6xl shadow-2xl group-hover:rotate-6 transition-transform duration-700">
                  💳
                  <div className="absolute -bottom-3 -right-3 text-2xl filter drop-shadow-md">{NIVEL_CFG[card.level].icon}</div>
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-3">
                  <Badge variant={card.level === 'ok' ? 'success' : card.level === 'warning' ? 'warning' : 'danger'} glow className="mb-4 px-5 py-1 uppercase font-black tracking-[0.3em] text-[9px]">
                    CREDIT: {card.used_pct}% USED
                  </Badge>
                  <p className="text-tx-secondary text-[17px] font-medium leading-relaxed max-w-3xl">
                    Saturation of <span className="text-tx-primary font-black underline decoration-2 decoration-accent/30">{fmt(card.used)}</span> over a total limit of {fmt(card.total_limit)}. Immediate availability: <span className="text-success font-black">{fmt(card.available)}</span>.
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                     <div className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: NIVEL_CFG[card.level].color }} />
                     <p className="text-[12px] font-black uppercase tracking-[0.2em] italic" style={{ color: NIVEL_CFG[card.level].color }}>
                        {card.advice}
                     </p>
                  </div>
                </div>

                <Link to="/tarjeta" className="shrink-0">
                  <Button variant="ghost" className="px-10 h-14 border border-border-base uppercase font-black text-[10px] tracking-[0.4em] hover:bg-tx-primary/5">Card Management →</Button>
                </Link>
              </div>
              
              <div className="mt-12 h-3 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-premium" 
                  style={{ width: `${Math.min(card.used_pct, 100)}%`, backgroundColor: NIVEL_CFG[card.level].color, boxShadow: `0 0 20px ${NIVEL_CFG[card.level].color}44` }} 
                />
              </div>
            </Card>
          )}

          {/* ── Critical Warnings First ── */}
          {danger_secs.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-6 px-4">
                <Badge variant="danger" glow className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full">CRITICAL STATUS</Badge>
                <div className="h-px flex-1 bg-linear-to-r from-danger/30 via-danger/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {danger_secs.map(s => <SectionCard key={s.section} sec={s} />)}
              </div>
            </section>
          )}

          {/* ── Attention Warnings ── */}
          {warning_secs.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-6 px-4">
                <Badge variant="warning" glow className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full">OBSERVATION MODE</Badge>
                <div className="h-px flex-1 bg-linear-to-r from-warning/30 via-warning/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {warning_secs.map(s => <SectionCard key={s.section} sec={s} />)}
              </div>
            </section>
          )}

          {/* ── OK Sections ── */}
          {ok_secs.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-6 px-4">
                <Badge variant="success" glow className="px-5 py-1 tracking-[0.4em] font-black text-[10px] rounded-full">OPTIMIZED ZONE</Badge>
                <div className="h-px flex-1 bg-linear-to-r from-success/30 via-success/10 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {ok_secs.map(s => <SectionCard key={s.section} sec={s} />)}
              </div>
            </section>
          )}

          {/* ── No Data ── */}
          {nodata_secs.length > 0 && (
            <details className="card p-0 overflow-hidden transition-all duration-500 group border-none shadow-premium opacity-50 hover:opacity-100 bg-tx-primary/[0.01]">
              <summary className="p-10 cursor-pointer list-none flex items-center justify-between hover:bg-tx-primary/[0.02]">
                <div className="flex items-center gap-6">
                  <span className="text-3xl grayscale opacity-40">❄️</span>
                  <span className="text-[12px] font-black text-tx-muted uppercase tracking-[0.4em]">Transactional Inactivity ({nodata_secs.length} Cold Sectors)</span>
                </div>
                <div className="text-tx-muted transition-transform group-open:rotate-180">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </summary>
              <div className="p-12 pt-6 grid grid-cols-1 md:grid-cols-3 gap-10 animate-in slide-in-from-top-4">
                {nodata_secs.map(s => <SectionCard key={s.section} sec={s} />)}
              </div>
            </details>
          )}

          {/* ── References ── */}
          <Card className="overflow-hidden shadow-premium border-none">
            <div className="p-12 border-b border-border-base bg-tx-primary/[0.01]">
                <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">Sectoral Audit Matrix</h3>
                <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest mt-2 opacity-30">Validation criteria applied to global sustainability analysis</p>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-tx-muted opacity-40 border-b border-border-base bg-tx-primary/[0.02] tracking-[0.4em]">
                    <th className="p-10 pl-14">Sector Metric</th>
                    <th className="p-10 text-right">GREEN ZONE ✓</th>
                    <th className="p-10 text-right">AMBER ZONE ⚠️</th>
                    <th className="p-10 text-right">RED ZONE 🚨</th>
                    <th className="p-10 pl-14">Regulatory Framework</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {sections.map(s => {
                    return (
                      <tr key={s.section} className="transition-all hover:bg-tx-primary/[0.02] group">
                        <td className="p-8 pl-14">
                           <div className="flex items-center gap-8">
                              <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-700">{s.icon}</span>
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-tx-primary uppercase tracking-widest">{s.section}</span>
                                 <Badge variant="muted" size="sm" className="w-fit mt-2 opacity-30 font-black text-[8px] tracking-[0.2em]">ISO_SAFE_302</Badge>
                              </div>
                           </div>
                        </td>
                        <td className="p-10 text-right font-black text-success tabular-nums tracking-tighter text-xl drop-shadow-sm">
                          {s.invert ? `≥ ${s.min_ok}%` : `≤ ${s.max_ok}%`}
                        </td>
                        <td className="p-10 text-right font-black text-warning tabular-nums tracking-tighter text-xl opacity-60">
                          {s.invert ? `${s.min_warning}–${s.min_ok}%` : `${s.max_ok}–${s.max_warning}%`}
                        </td>
                        <td className="p-10 text-right font-black text-danger tabular-nums tracking-tighter text-xl opacity-60">
                          {s.invert ? `< ${s.min_warning}%` : `> ${s.max_warning}%`}
                        </td>
                        <td className="p-10 pl-14 text-[11px] font-black italic text-tx-muted uppercase opacity-20 tracking-tight leading-relaxed max-w-[240px]">{s.reference}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <footer className="p-12 border-t border-border-base flex flex-col md:flex-row justify-between items-center opacity-30 hover:opacity-100 transition-all group/footer">
               <p className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] max-w-3xl text-center md:text-left leading-loose group-hover/footer:text-tx-primary transition-colors">Compliance Stack: Ramsey Intelligence Protocol 70/30 · OCDE Home Finance Directive · CMF Standards Suite 2026 · AI Diagnostic Core</p>
               <div className="mt-10 md:mt-0 flex flex-col items-end gap-1">
                  <p className="text-[11px] font-black text-tx-primary uppercase tracking-[0.4em] leading-none">Enterprise Platform v4.5</p>
                  <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.2em] mt-1">Deepmind Agentic Coding Core</p>
               </div>
            </footer>
          </Card>
        </>
      )}
    </div>
  )
}
