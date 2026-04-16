import React from "react";
import Card from "../atoms/Card";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import VarBadge from "../molecules/VarBadge";
import ExpenseMatrixRow from "../molecules/ExpenseMatrixRow";

const MonthViewBlock = ({
  sections,
  rowsGroupedBySection,
  monthIdx,
  MONTH_KEYS,
  ACTUAL_MONTH_KEYS,
  CARD_MONTH_KEYS,
  collapsed,
  toggleCollapse,
  saving,
  handleCellChange,
  handleSaveRow,
  setConfirmId,
  setForm,
  setModal,
  isAutoSync,
  fmt,
}) => {
  return sections.map((sec) => {
    const secRows = rowsGroupedBySection[sec.id] || [];
    const monthKey = MONTH_KEYS[monthIdx];
    const realMonthKey = ACTUAL_MONTH_KEYS[monthIdx];
    const cardMonthKey = CARD_MONTH_KEYS[monthIdx];

    const planSec = secRows.reduce(
      (s, r) => s + (parseFloat(r[monthKey]) || 0),
      0,
    );
    const actualSec = secRows.reduce(
      (s, r) => s + (parseFloat(r[realMonthKey]) || 0),
      0,
    );
    const tcSec = secRows.reduce(
      (s, r) => s + (parseFloat(r[cardMonthKey]) || 0),
      0,
    );
    const totalExecutedSec = actualSec + tcSec;
    const color = sec.color_accent || '#6366f1';

    return (
      <Card
        key={sec.id}
      className="overflow-hidden border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500"
      style={{ borderLeft: `8px solid ${color}` }}
    >
      <div
        className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors"
        onClick={() => toggleCollapse(sec.id)}
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500 filter drop-shadow-sm">
            {sec.icon || "📂"}
          </span>
          <div className="flex flex-col">
            <h3 className="text-[12px] font-black text-tx-primary uppercase tracking-[0.2em]">
              {sec.name}
            </h3>
            <Badge
              variant="muted"
              size="sm"
              className="w-fit mt-2 opacity-30 font-black tracking-[0.2em] uppercase text-[8px]"
            >
              Sec_ID {sec.id}
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 md:px-6 md:py-2 items-center">
          <div className="hidden md:flex gap-6 lg:px-6 lg:py-2 text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="flex flex-col items-end">
              <span className="text-tx-muted opacity-40 text-[9px]">PLAN</span>
              <span className="text-warning font-black tracking-tighter text-base">
                {fmt(planSec)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-tx-muted opacity-40 text-[9px]">
                ACTUAL
              </span>
              <span
                className={`font-black tracking-tighter text-base ${actualSec > planSec ? "text-danger" : "text-success"}`}
              >
                {fmt(actualSec)}
              </span>
            </div>
            {tcSec > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-tx-muted opacity-40 text-[9px]">
                  CARD
                </span>
                <span className="text-danger-light font-black tracking-tighter text-base">
                  {fmt(tcSec)}
                </span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="px-6 h-8 uppercase font-black text-[10px] tracking-widest bg-tx-primary/5 hover:bg-tx-primary/10 text-tx-primary hover:text-accent transition-colors shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setForm({ section_id: sec.id, description: "" });
              setModal(true);
            }}
          >
            + Inject
          </Button>
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
        <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted bg-tx-primary/[0.02] border-b border-border-base/40">
                <th className="p-4 pl-6">Operational Concept</th>
                <th className="p-4 text-right w-40">📈 Budget</th>
                <th className="p-4 text-right w-40">🎯 Actual</th>
                <th className="p-4 text-right w-40">💳 Card</th>
                <th className="p-4 text-right">Differential</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/60">
              {secRows.map((row) => (
                <ExpenseMatrixRow
                  key={row.id}
                  row={row}
                  auto={isAutoSync(row.description, row.is_automatic)}
                  monthKey={monthKey}
                  realMonthKey={realMonthKey}
                  cardMonthKey={cardMonthKey}
                  saving={saving}
                  handleCellChange={handleCellChange}
                  handleSaveRow={handleSaveRow}
                  setConfirmId={setConfirmId}
                  fmt={fmt}
                />
              ))}
            </tbody>
            <tfoot className="bg-tx-primary/[0.04] border-t border-border-base/40 relative">
              <tr className="font-black text-[11px] text-tx-primary uppercase tracking-[0.2em] h-14">
                <td className="p-4 pl-6">Consolidated Total {sec.name}</td>
                <td className="p-7 text-right text-warning text-lg tracking-tighter drop-shadow-sm">
                  {fmt(planSec)}
                </td>
                <td className="p-7 text-right text-purple text-lg tracking-tighter">
                  {fmt(actualSec)}
                </td>
                <td className="p-7 text-right text-danger-light text-lg tracking-tighter">
                  {tcSec > 0 ? fmt(tcSec) : "—"}
                </td>
                <td className="p-4 text-right">
                  <VarBadge plan={planSec} actual={totalExecutedSec} />
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      </Card>
    );
  });
};

export default MonthViewBlock;
