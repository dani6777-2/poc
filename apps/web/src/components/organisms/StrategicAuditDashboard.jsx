import React from "react";
import Card from "../atoms/Card";
import ScoreGauge from "../molecules/ScoreGauge";
import RuleBar from "../molecules/RuleBar";
import { fmt } from "../../utils/formatters";

const StrategicAuditDashboard = ({
  score,
  level,
  rule,
  activeAlerts,
  okSecsCount,
  totalActualSpending,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-10">
      <Card className="p-10 flex flex-col items-center justify-center gap-12 relative overflow-hidden group shadow-premium border-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
        <ScoreGauge score={score} level={level} />

        <div className="w-full space-y-5 pt-10 border-t border-border-base relative">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
              Active Deviations
            </span>
            <span
              className={`text-3xl font-black tabular-nums tracking-tighter transition-all ${activeAlerts > 0 ? "text-danger drop-shadow-glow-danger scale-110" : "text-success"}`}
            >
              {activeAlerts || 0}
            </span>
          </div>
          <div className="flex items-baseline justify-between opacity-30 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-black text-tx-muted uppercase tracking-[0.3em]">
              Optimized Sectors
            </span>
            <span className="text-lg font-black text-success tabular-nums">
              {okSecsCount}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-12 relative overflow-hidden shadow-premium border-none">
        <div className="flex items-center gap-4 mb-14">
          <div className="w-2 h-7 bg-accent rounded-full shadow-glow-accent" />
          <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">
            Health Protocol 50/30/20
          </h3>
        </div>

        <div className="space-y-4">
          {Object.entries(rule).map(([key, g]) => (
            <RuleBar
              key={key}
              label={g.label}
              icon={g.icon}
              pct={g.pct}
              meta={g.meta}
              level={g.level}
              total={g.total}
            />
          ))}
        </div>

        <div className="mt-14 pt-12 border-t border-border-base flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] opacity-30 block">
              Total Actual Period Spending
            </label>
            <div className="text-3xl font-black text-tx-primary tabular-nums tracking-tighter drop-shadow-sm">
              {fmt(totalActualSpending)}
            </div>
          </div>
          <p className="text-[10px] text-tx-muted italic font-bold max-w-[480px] text-right leading-relaxed opacity-20 uppercase tracking-[0.1em]">
            Audit algorithm based on high-fidelity heritage planning
            international standards.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default StrategicAuditDashboard;
