import React from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import { NIVEL_COLOR, NIVEL_ICON } from "../../constants/finance";
import { fmt } from "../../utils/formatters";

const CostVerticalAudit = ({
  hasPlanVsActual,
  pvr,
  healthMap,
  health,
  barPvrData,
  chartOptions,
}) => {
  return (
    <Card className="overflow-hidden border border-border-base shadow-premium">
      <div className="p-5 md:p-8 border-b border-border-base bg-tx-primary/[0.01] flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.25em]">
            Planned vs Actual by Vertical
          </h3>
          <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest mt-1 opacity-40">
            Detailed analysis of structural deviations
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/health">
            <Button variant="ghost" size="sm" className="text-[11px]">
              🏥 Full Health
            </Button>
          </Link>
          <Link to="/annual-expenses">
            <Button variant="ghost" size="sm" className="text-[11px]">
              📋 Roadmap
            </Button>
          </Link>
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
                    {health && !health.no_revenue && (
                      <th className="p-6 text-center w-32">Rev. Ratio</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {pvr.map((r) => {
                    const over = r.variance < 0;
                    const under = r.variance > 0;
                    const sSec = healthMap[r.section];
                    const nColor = sSec ? NIVEL_COLOR[sSec.level] : null;

                    return (
                      <tr
                        key={r.section}
                        className="hover:bg-tx-primary/[0.01] transition-colors group"
                      >
                        <td
                          className="p-5 pl-10 border-l-4 transition-all border-l-[var(--n-col)]"
                          style={{ "--n-col": nColor || "transparent" }}
                        >
                          <div className="text-sm font-bold text-tx-primary group-hover:translate-x-1 transition-transform">
                            {r.section}
                          </div>
                        </td>
                        <td className="p-5 text-right tabular-nums text-sm font-bold text-tx-muted">
                          {r.planned > 0 ? (
                            fmt(r.planned)
                          ) : (
                            <span className="opacity-20">—</span>
                          )}
                        </td>
                        <td className="p-5 text-right tabular-nums">
                          <span
                            className={`text-sm font-black ${r.actual > 0 ? "text-warning" : "text-tx-muted opacity-20"}`}
                          >
                            {r.actual > 0 ? fmt(r.actual) : "—"}
                          </span>
                        </td>
                        <td
                          className={`p-5 text-right tabular-nums text-sm font-black ${over ? "text-danger" : under ? "text-success" : "text-tx-muted"}`}
                        >
                          {r.planned > 0 && r.actual > 0 ? (
                            <div className="flex items-center justify-end gap-1.5 underline decoration-2 decoration-current/10 underline-offset-4">
                              <span className="text-[10px] opacity-40">
                                {over ? "▲" : "▼"}
                              </span>
                              {fmt(Math.abs(r.variance))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center">
                            {r.planned > 0 && r.actual > 0 ? (
                              <Badge
                                variant={over ? "danger" : "success"}
                                className="px-4"
                              >
                                {over
                                  ? `${(((r.actual - r.planned) / r.planned) * 100).toFixed(0)}% EXCESS`
                                  : "BALANCED"}
                              </Badge>
                            ) : r.actual > 0 ? (
                              <Badge variant="warning" className="px-4">
                                OFF PLAN
                              </Badge>
                            ) : (
                              <span className="text-[9px] font-black text-tx-muted opacity-20 tracking-widest uppercase">
                                STABLE
                              </span>
                            )}
                          </div>
                        </td>
                        {health && !health.no_revenue && (
                          <td className="p-5 text-center">
                            {sSec && sSec.level !== "no_data" ? (
                              <div
                                className="flex flex-col items-center gap-1"
                                title={sSec.advice}
                              >
                                <span className="text-sm">
                                  {NIVEL_ICON[sSec.level]}
                                </span>
                                <span
                                  className="text-[10px] font-black text-[var(--n-col)]"
                                  style={{ "--n-col": nColor }}
                                >
                                  {sSec.revenue_pct}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-tx-muted opacity-20">
                                —
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-tx-primary/5 text-sm group font-black">
                    <td className="p-6 pl-10 text-tx-primary tracking-[0.2em] uppercase">
                      Aggregate Metrics
                    </td>
                    <td className="p-6 text-right tabular-nums text-tx-primary/40">
                      {fmt(pvr.reduce((s, r) => s + r.planned, 0))}
                    </td>
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
              <div className="p-5 md:p-8 bg-danger/[0.02] border-y border-danger/10 flex flex-col gap-5">
                <div className="flex items-center gap-3 text-danger font-black uppercase text-[10px] tracking-[0.25em]">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-danger"></span>
                  </span>
                  Active Strategic Deviations
                </div>
                <div className="flex gap-4 flex-wrap">
                  {health.sections
                    .filter((s) => s.level !== "ok" && s.level !== "no_data")
                    .map((s) => (
                      <div
                        key={s.section}
                        className="px-5 py-3 rounded-2xl bg-secondary/50 border border-border-base flex items-center gap-4 hover:border-danger/30 transition-all cursor-help"
                        title={s.advice}
                      >
                        <span className="text-lg">{NIVEL_ICON[s.level]}</span>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-tx-primary uppercase tracking-tight">
                            {s.section}
                          </span>
                          <span className="text-[10px] font-black text-danger/80">
                            {s.revenue_pct}% Actual{" "}
                            <span className="opacity-30">/</span>{" "}
                            {s.max_ok || s.min_ok}% Target
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Performance Chart */}
            <div className="p-6 lg:p-10 h-[380px]">
              <Bar
                data={barPvrData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      ...chartOptions.plugins.tooltip,
                      callbacks: {
                        ...chartOptions.plugins.tooltip.callbacks,
                        afterLabel: (ctx) => {
                          if (ctx.datasetIndex === 1) {
                            const sec = healthMap[pvr[ctx.dataIndex]?.section];
                            return sec
                              ? `Performance Index: ${sec.level.toUpperCase()}`
                              : "";
                          }
                          return "";
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </>
        ) : (
          <div className="p-40 flex flex-col items-center justify-center text-center opacity-30 gap-6">
            <div className="text-6xl text-tx-muted/20">📉</div>
            <div className="space-y-2">
              <p className="text-lg font-black text-tx-primary uppercase tracking-widest">
                Undefined Structure
              </p>
              <p className="text-sm font-medium text-tx-secondary max-w-sm">
                No structural projection has been detected for this time period.
              </p>
            </div>
            <Link to="/annual-expenses">
              <Button variant="accent" className="mt-4">
                Configure Projection
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CostVerticalAudit;
