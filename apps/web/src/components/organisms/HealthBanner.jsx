import React from "react";
import { Link } from "react-router-dom";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import { NIVEL_COLOR } from "../../constants/finance";

const HealthBanner = ({ health }) => {
  if (!health || health.no_revenue) return null;

  return (
    <Card
      className="p-5 md:p-8 overflow-hidden relative group border-none shadow-2xl"
      glow={health.global_level !== "ok"}
    >
      <div
        className="absolute top-0 right-0 w-96 h-96 opacity-[0.05] -translate-y-1/2 translate-x-1/2 rounded-full blur-[100px] pointer-events-none bg-[var(--health-color)]"
        style={{ '--health-color': NIVEL_COLOR[health.global_level] }}
      />

      <div className="relative flex flex-col md:flex-row items-center gap-6 lg:p-10">
        <div
          className="text-6xl font-black tabular-nums tracking-tighter text-[var(--h-col)]"
          style={{ '--h-col': NIVEL_COLOR[health.global_level] }}
        >
          {health.global_score}
          <span className="text-2xl opacity-40">%</span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <Badge
            variant={
              health.global_level === "ok"
                ? "success"
                : health.global_level === "warning"
                  ? "warning"
                  : "danger"
            }
            glow
            className="mb-3 px-4 py-1.5"
          >
            {health.global_level === "ok"
              ? "STATUS: OPTIMIZED"
              : health.global_level === "warning"
                ? "ALERT DETECTED"
                : "CRITICAL RISK"}
          </Badge>
          <p className="text-tx-secondary text-[14px] font-medium leading-relaxed max-w-xl">
            {health.active_alerts > 0
              ? `Attention: ${health.active_alerts} critical deviations have been detected in your spending ceilings that require immediate intervention.`
              : "Excellent: Your spending architecture operates within the efficiency parameters defined for this period."}
          </p>
        </div>

        <div className="w-full md:w-64 space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-tx-muted">
            <span>Operational Efficiency</span>
            <span>{health.global_score}%</span>
          </div>
          <div className="h-2.5 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out shadow-[var(--h-sh)] bg-[var(--h-col)] w-[var(--h-pct)]"
              style={{
                '--h-pct': `${health.global_score}%`,
                '--h-col': NIVEL_COLOR[health.global_level],
                '--h-sh': `0 0 15px ${NIVEL_COLOR[health.global_level]}44`,
              }}
            />
          </div>
        </div>

        <Link to="/health">
          <Button variant="ghost" className="whitespace-nowrap">
            Full Audit →
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default HealthBanner;
