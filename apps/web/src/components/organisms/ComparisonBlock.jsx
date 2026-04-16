import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import VarBadge from "../molecules/VarBadge";

const ComparisonBlock = ({
  sections,
  rowsGroupedBySection,
  MONTH_LABELS,
  MONTH_KEYS,
  ACTUAL_MONTH_KEYS,
  collapsed,
  toggleCollapse,
  fmt,
}) => {
  return sections.map((sec) => {
    const secRows = rowsGroupedBySection[sec.id] || [];
    if (secRows.length === 0) return null;
    const color = sec.color_accent || "#6366f1";
    const plannedMonths = MONTH_KEYS.map((m) =>
      secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0),
    );
    const actualMonths = ACTUAL_MONTH_KEYS.map((m) =>
      secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0),
    );
    const plannedTotal = plannedMonths.reduce((a, b) => a + b, 0);
    const actualTotal = actualMonths.reduce((a, b) => a + b, 0);

    return (
      <Card
        key={sec.id}
        className="overflow-hidden border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500"
        style={{ borderLeft: `6px solid ${color}` }}
      >
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors"
          onClick={() => toggleCollapse(sec.id)}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all duration-700">
              {sec.icon || "📂"}
            </span>
            <h4 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em]">
              {sec.name}
            </h4>
          </div>
          <div className="flex gap-8 lg:p-16 items-center">
            <div className="hidden lg:flex gap-6 md:p-12 text-[10px] font-black uppercase tracking-[0.2em] text-tx-muted opacity-60">
              <div className="flex flex-col items-end">
                <span>PLAN</span>
                <span className="text-warning font-black text-[15px] tracking-tighter mt-1">
                  {fmt(plannedTotal)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span>ACTUAL</span>
                <span
                  className={`font-black text-[15px] tracking-tighter mt-1 ${actualTotal > plannedTotal ? "text-danger" : "text-success"}`}
                >
                  {fmt(actualTotal)}
                </span>
              </div>
            </div>
            <VarBadge plan={plannedTotal} actual={actualTotal} />
            <span
              className="text-tx-muted opacity-20 px-4 transition-transform duration-500"
              style={{
                transform: collapsed[sec.id] ? "rotate(0deg)" : "rotate(90deg)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </div>
        </div>

        {!collapsed[sec.id] && (
          <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40 shadow-inner">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted/40 bg-tx-primary/[0.02] border-b border-border-base/40">
                  <th className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-lg border-r border-border-base/40">
                    Analytical Layer
                  </th>
                  {MONTH_LABELS.map((m) => (
                    <th key={m} className="p-6 text-right tracking-widest">
                      {m}
                    </th>
                  ))}
                  <th className="p-6 text-right text-tx-primary bg-tx-primary/[0.04]">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base/40">
                <tr className="hover:bg-warning/[0.03] transition-colors relative h-16">
                  <td className="p-5 px-10 text-[11px] font-black text-warning uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-widest leading-none">
                    ⏳ Budget
                    <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">
                      ESTIMATED_FLOW
                    </div>
                  </td>
                  {plannedMonths.map((v, i) => (
                    <td
                      key={i}
                      className="p-5 text-right font-black text-xs text-warning/70 tabular-nums tracking-tighter"
                    >
                      {v > 0 ? fmt(v) : "—"}
                    </td>
                  ))}
                  <td className="p-5 text-right font-black text-sm text-warning tabular-nums tracking-tighter bg-warning/[0.03]">
                    {fmt(plannedTotal)}
                  </td>
                </tr>
                <tr className="hover:bg-purple/[0.03] transition-colors relative h-16">
                  <td className="p-5 px-10 text-[11px] font-black text-purple uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-widest leading-none">
                    🔍 Actual Expense
                    <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">
                      EVIDENCED_BURN
                    </div>
                  </td>
                  {actualMonths.map((v, i) => (
                    <td
                      key={i}
                      className="p-5 text-right font-black text-xs text-purple/70 tabular-nums tracking-tighter"
                    >
                      {v > 0 ? fmt(v) : "—"}
                    </td>
                  ))}
                  <td className="p-5 text-right font-black text-sm text-purple tabular-nums tracking-tighter bg-purple/[0.03]">
                    {fmt(actualTotal)}
                  </td>
                </tr>
                <tr className="bg-tx-primary/[0.05] border-t-2 border-border-base/20 relative h-20">
                  <td className="p-6 px-10 text-[12px] font-black text-tx-primary uppercase sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl tracking-[0.2em] leading-none">
                    ⚖️ Variance
                    <div className="text-[7px] text-tx-muted opacity-30 mt-2 font-black">
                      VARIANCE_AUDIT
                    </div>
                  </td>
                  {plannedMonths.map((p, i) => {
                    const diff = p - actualMonths[i];
                    return (
                      <td
                        key={i}
                        className={`p-6 text-right font-black text-xs tabular-nums tracking-tighter ${diff >= 0 ? "text-success" : "text-danger"}`}
                      >
                        {p || actualMonths[i] ? fmt(diff) : "—"}
                      </td>
                    );
                  })}
                  <td
                    className={`p-6 text-right font-black text-base tabular-nums tracking-tighter ${plannedTotal - actualTotal >= 0 ? "text-success drop-shadow-glow-success" : "text-danger drop-shadow-glow-danger"}`}
                  >
                    {fmt(plannedTotal - actualTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  });
};

export default ComparisonBlock;
