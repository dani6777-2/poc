import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import { NIVEL_CFG } from "../../constants/finance";
import { fmt } from "../../utils/formatters";

const SectionHealthCard = ({ sec }) => {
  const cfg = NIVEL_CFG[sec.level] || NIVEL_CFG.no_data;
  const pct = sec.revenue_pct;
  const maxRef = sec.invert ? sec.min_ok || 20 : sec.max_ok || 100;
  const isHealthy = sec.invert ? pct >= maxRef : pct <= maxRef;

  return (
    <Card
      interactive
      border={false}
      className="p-5 md:p-8 group shadow-premium relative overflow-hidden transition-all hover:-translate-y-1 border-t-[4px] border-[var(--cfg-col)]"
      style={{ "--cfg-col": cfg.color }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-10 transition-all blur-3xl pointer-events-none bg-[var(--cfg-col)]"
        style={{ "--cfg-col": cfg.color }}
      />

      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <span className="text-4xl drop-shadow-md grayscale group-hover:grayscale-0 transition-all duration-500">
              {sec.icon}
            </span>
            <h4 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.25em]">
              {sec.section}
            </h4>
          </div>
          <Badge
            variant="muted"
            size="sm"
            className="w-fit mt-3 opacity-60 tracking-[0.3em] font-black uppercase text-[8px]"
          >
            Protocol {sec.level.toUpperCase()}
          </Badge>
        </div>
        <div className="text-3xl filter drop-shadow-sm">{cfg.icon}</div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div
            className="text-5xl font-black tabular-nums tracking-tighter transition-transform group-hover:scale-110 origin-left text-[var(--cfg-col)]"
            style={{ "--cfg-col": cfg.color }}
          >
            {pct !== undefined && pct !== null ? `${pct}%` : "—"}
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-tx-muted uppercase tracking-widest leading-none opacity-40 mb-1">
              Market Ref.
            </div>
            <div className="text-[11px] font-black text-tx-primary uppercase tracking-tighter">
              {sec.reference}
            </div>
          </div>
        </div>

        <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden p-[1px]">
          {pct !== null && (
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out w-[var(--cfg-w)] bg-[var(--cfg-col)] shadow-[var(--cfg-sh)]"
              style={{
                "--cfg-w": `${Math.min((pct / (maxRef * 1.5)) * 100, 100)}%`,
                "--cfg-col": cfg.color,
                "--cfg-sh": `0 0 15px ${cfg.color}33`,
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">
            {fmt(sec.expense)} assigned
          </p>
          <div
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isHealthy ? "text-success" : "text-danger"} opacity-80`}
          >
            <span className="text-sm">{isHealthy ? "✓" : "⚠"}</span>{" "}
            {isHealthy ? "Sustainable" : "Deviated"}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border-base relative">
        <div
          className={`text-[12px] font-medium leading-relaxed ${sec.level === "no_data" ? "text-tx-muted italic opacity-30 text-[11px]" : "text-[var(--cfg-col)]"}`}
          style={{ "--cfg-col": sec.level === "no_data" ? undefined : cfg.color }}
        >
          {sec.level === "no_data"
            ? "Database without active records for this period"
            : sec.advice}
        </div>
      </div>
    </Card>
  );
};

export default SectionHealthCard;
