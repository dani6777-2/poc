import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import RevenueMatrixRow from "../molecules/RevenueMatrixRow";

/**
 * RevenueMatrixTable
 * Main table for annual revenue streams audits.
 */
const RevenueMatrixTable = ({
  rows,
  loading,
  saving,
  MONTH_LABELS,
  MONTH_KEYS,
  onCellChange,
  onDeleteRequest,
  totalsByMonth,
  totalAnnual,
  totalRow,
  fmt,
}) => {
  return (
    <Card className="overflow-hidden shadow-premium border-none">
      <div className="p-10 border-b border-border-base flex items-center justify-between bg-border-base/5">
        <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-tx-primary">
          Revenue Audit Worksheet
        </h3>
        <Badge
          variant="success"
          glow
          className="px-5 py-1 text-[9px] tracking-[0.3em] font-black uppercase"
        >
          CLOUD_SYNC_ACTIVE
        </Badge>
      </div>

      <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-360px)]">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border-base/60 shadow-premium">
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted sticky left-0 z-30 bg-secondary/95 backdrop-blur-xl border-r border-border-base/40">
                Revenue Source
              </th>
              {MONTH_LABELS.map((m) => (
                <th
                  key={m}
                  className="p-6 text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted text-right bg-secondary/95 backdrop-blur-xl"
                >
                  {m}
                </th>
              ))}
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.4em] text-accent-light text-right bg-tx-primary/[0.04] backdrop-blur-xl">
                Consolidated Annual
              </th>
              <th className="w-16 p-8 bg-tx-primary/[0.04] backdrop-blur-xl"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {loading ? (
              <tr>
                <td
                  colSpan={MONTH_KEYS.length + 3}
                  className="py-40 text-center"
                >
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-tx-muted">
                      Sychronizing capital flows...
                    </p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={MONTH_KEYS.length + 3}
                  className="py-60 text-center"
                >
                  <div className="flex flex-col items-center gap-8 opacity-20 grayscale">
                    <span className="text-7xl animate-bounce">📥</span>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] max-w-sm leading-loose">
                      No records detected <br /> define your first revenue
                      source
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <RevenueMatrixRow
                  key={row.id}
                  row={row}
                  MONTH_KEYS={MONTH_KEYS}
                  onCellChange={onCellChange}
                  onDeleteRequest={onDeleteRequest}
                  isSaving={saving[row.id]}
                  totalRow={totalRow}
                  fmt={fmt}
                />
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="sticky bottom-0 z-30 shadow-premium">
              <tr className="bg-secondary/95 backdrop-blur-xl border-t border-border-base/60 h-28">
                <td className="p-8 font-black text-[11px] uppercase tracking-[0.5em] text-tx-muted sticky left-0 z-30 bg-secondary/95 border-r border-border-base/40">
                  ANNUALIZED TOTAL
                </td>
                {totalsByMonth.map((t, i) => (
                  <td
                    key={i}
                    className="p-6 text-right font-black text-[17px] text-tx-primary tabular-nums tracking-tighter decoration-accent/30 underline underline-offset-8 transition-all hover:text-accent-light cursor-help decoration-4"
                    title={`Consolidated total for ${MONTH_LABELS[i]}`}
                  >
                    {fmt(t)}
                  </td>
                ))}
                <td className="p-8 text-right font-black text-[28px] text-success drop-shadow-glow-success tabular-nums tracking-tighter bg-tx-primary/[0.04] border-l border-border-base/60 underline decoration-success/20 underline-offset-[12px] decoration-4">
                  {fmt(totalAnnual)}
                </td>
                <td className="bg-tx-primary/[0.04]"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
};

export default RevenueMatrixTable;
