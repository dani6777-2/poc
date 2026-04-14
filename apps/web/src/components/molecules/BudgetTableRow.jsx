import React from "react";
import Badge from "../atoms/Badge";

/**
 * BudgetTableRow
 * Individual row for the Budget limit comparison table.
 */
const BudgetTableRow = ({
  row,
  secObj,
  refVal,
  onSave,
  onChange,
  isSaving,
  totalRevenue,
  fmt,
}) => {
  const budgetVal = parseFloat(row.budget) || 0;
  const actualVal = parseFloat(row.actual_spending) || 0;
  const rowBal = budgetVal > 0 ? budgetVal - actualVal : 0;
  const rowPct = budgetVal > 0 ? Math.round((actualVal / budgetVal) * 100) : 0;
  const pctRevenue =
    totalRevenue > 0 ? ((actualVal / totalRevenue) * 100).toFixed(1) : null;
  const seccion = secObj?.name || "—";

  return (
    <tr className="hover:bg-tx-primary/[0.01] transition-colors group">
      <td className="p-6 pl-10">
        <span className="font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-wider">
          {row.category_name}
        </span>
      </td>
      <td className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-base grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            {secObj?.icon || "📂"}
          </span>
          <span className="text-[10px] font-bold text-tx-muted uppercase tracking-tighter truncate max-w-[120px]">
            {seccion}
          </span>
          {refVal > 0 && (
            <span className="text-[9px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20">
              Synced
            </span>
          )}
        </div>
      </td>
      <td className="p-6">
        <div className="flex items-center gap-2 bg-tx-primary/5 border border-border-base rounded-xl px-4 py-2.5 w-36 focus-within:border-accent/40 transition-all">
          <span className="text-tx-muted opacity-30 font-black text-xs">$</span>
          <input
            type="number"
            step="1000"
            value={row.budget || ""}
            onChange={(e) => onChange(row.id, "budget", e.target.value)}
            className="bg-transparent border-none text-tx-primary font-black w-full outline-none text-xs tabular-nums"
            placeholder="0"
          />
        </div>
      </td>
      <td className="p-6">
        <span
          className={`text-sm font-black tabular-nums ${actualVal > 0 ? "text-yellow" : "text-tx-muted opacity-30"}`}
        >
          {fmt(actualVal)}
        </span>
      </td>
      <td
        className={`p-6 text-sm font-black tabular-nums ${rowBal < 0 ? "text-danger" : actualVal > 0 ? "text-success" : "text-tx-muted opacity-30"}`}
      >
        {budgetVal > 0
          ? rowBal < 0
            ? `(${fmt(Math.abs(rowBal))})`
            : fmt(rowBal)
          : "—"}
      </td>
      <td className="p-6">
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="flex-1 h-1.5 bg-tx-primary/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${rowPct >= 100 ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${Math.min(rowPct, 100)}%` }}
            ></div>
          </div>
          <span
            className={`text-[11px] font-black tabular-nums w-8 text-right ${rowPct >= 100 ? "text-danger" : "text-tx-secondary"}`}
          >
            {rowPct}%
          </span>
        </div>
      </td>
      {totalRevenue > 0 && (
        <td className="p-6">
          <span className="text-[11px] font-black text-tx-muted opacity-40 tabular-nums">
            {pctRevenue}%
          </span>
        </td>
      )}
      <td className="p-6 text-right pr-10">
        <button
          className="p-2.5 rounded-xl bg-tx-primary/5 text-tx-primary hover:bg-accent hover:text-primary transition-all disabled:opacity-30 flex items-center justify-center float-right"
          onClick={() => onSave(row)}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "💾"
          )}
        </button>
      </td>
    </tr>
  );
};

export default BudgetTableRow;
