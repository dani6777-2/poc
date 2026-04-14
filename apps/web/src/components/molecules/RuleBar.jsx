import React from "react";
import Badge from "../atoms/Badge";
import { NIVEL_CFG } from "../../constants/finance";
import { fmt } from "../../utils/formatters";

const RuleBar = ({ label, icon, pct, meta, level, total }) => {
  const cfg = NIVEL_CFG[level] || NIVEL_CFG.no_data;
  const fill = pct !== null ? Math.min((pct / (meta * 1.5)) * 100, 100) : 0;

  return (
    <div className="mb-8 group">
      <div className="flex justify-between items-end mb-4 px-1">
        <div className="flex flex-col gap-1">
          <span className="font-black text-[11px] uppercase tracking-widest text-tx-primary flex items-center gap-3">
            <span className="text-xl grayscale group-hover:grayscale-0 transition-all">
              {icon}
            </span>{" "}
            {label}
          </span>
          {pct !== null && (
            <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
              {fmt(total)} consumed
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-4">
            <span
              className="text-2xl font-black tabular-nums tracking-tighter"
              style={{ color: cfg.color }}
            >
              {pct !== undefined && pct !== null ? `${pct}%` : "—"}
            </span>
            <Badge
              variant={
                level === "ok"
                  ? "success"
                  : level === "warning"
                    ? "warning"
                    : "danger"
              }
              size="sm"
              className="px-3 font-black"
            >
              {cfg.label.replace("✓ ", "").replace("⚠ ", "").replace("🚨 ", "")}
            </Badge>
          </div>
          <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.4em] opacity-30">
            Reference Pt: {meta}%
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-tx-primary/5 rounded-full overflow-hidden relative p-[1px]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out shadow-premium"
          style={{
            width: `${fill}%`,
            background: cfg.color,
            boxShadow: `0 0 20px ${cfg.color}44`,
          }}
        />
        {/* Meta marker */}
        <div
          className="absolute top-0 w-1 h-full bg-tx-primary/10 shadow-glow transition-all duration-700"
          style={{ left: `${(1 / 1.5) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default RuleBar;
