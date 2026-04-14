import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analysisService } from '../services'
import { NIVEL_CFG } from '../constants/finance'
import { RECENT_MONTHS } from '../constants/time'
import { fmt } from '../utils/formatters'
import PageHeader from '../components/molecules/PageHeader'
import Card from '../components/atoms/Card'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'

// Organisms
import StrategicAuditDashboard from '../components/organisms/StrategicAuditDashboard'
import HealthSectionsGrid from '../components/organisms/HealthSectionsGrid'
import AuditMatrixTable from '../components/organisms/AuditMatrixTable'

export default function FinancialHealth() {
  const [month, setMonth] = useState(RECENT_MONTHS[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    analysisService.getHealthAlerts(month)
      .then(data => setData(data))
      .finally(() => setLoading(false))
  }, [month])

  const score = data?.global_score || 0
  const level = data?.global_level || 'no_data'
  const rule = data?.rule_50_30_20 || {}
  const card = data?.card

  const sections = data?.sections || []
  const danger_secs = sections.filter(s => s.level === 'danger')
  const warning_secs = sections.filter(s => s.level === 'warning')
  const ok_secs = sections.filter(s => s.level === 'ok')
  const nodata_secs = sections.filter(s => s.level === 'no_data')

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
              {RECENT_MONTHS.map(m => <option key={m} value={m} className="bg-secondary">{m}</option>)}
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
          <Link to="/revenues">
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
          <StrategicAuditDashboard
            score={score}
            level={level}
            rule={rule}
            activeAlerts={data?.active_alerts}
            okSecsCount={ok_secs.length}
            totalActualSpending={data?.cash_expense + data?.card_expense_total}
          />

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

                <Link to="/credit-card" className="shrink-0">
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

          <HealthSectionsGrid
            dangerSecs={danger_secs}
            warningSecs={warning_secs}
            okSecs={ok_secs}
            nodataSecs={nodata_secs}
          />

          <AuditMatrixTable sections={sections} />
        </>
      )}
    </div>
  )
}
