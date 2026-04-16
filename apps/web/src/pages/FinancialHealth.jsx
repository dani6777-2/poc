import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analysisService } from '../services'
import { NIVEL_CFG } from '../constants/finance'
import { RECENT_MONTHS } from '../constants/time'
import { fmt } from '../utils/formatters'
import { DashboardTemplate } from '../components/templates'
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
    <DashboardTemplate
      title={<>Strategic <span className="text-accent italic font-light">Control Panel</span></>}
      subtitle="Sustainability analytics and capital resilience"
      icon="🛡️"
      badge="Health Core Protocol V4.5"
      loading={loading}
      loadingText="Compiling biometric diagnosis..."
      headerAction={
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
    >
      {data?.no_revenue && (
        <Card border={false} className="p-5 md:p-8 bg-warning/5 border-l-4 border-warning flex flex-col md:flex-row items-center gap-5 md:p-8 animate-in slide-in-from-top-4 shadow-premium">
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

      <StrategicAuditDashboard
        score={score}
        level={level}
        rule={rule}
        activeAlerts={data?.active_alerts}
        okSecsCount={ok_secs.length}
        totalActualSpending={data?.cash_expense + data?.card_expense_total}
        card={card}
      />

          <HealthSectionsGrid
            dangerSecs={danger_secs}
            warningSecs={warning_secs}
            okSecs={ok_secs}
            nodataSecs={nodata_secs}
          />
          <AuditMatrixTable sections={sections} />
    </DashboardTemplate>
  )
}
