import React from "react";
import { Link } from "react-router-dom";
import Card from "../atoms/Card";
import BudgetTableRow from "../molecules/BudgetTableRow";

/**
 * BudgetLimitTable
 * Main table for managing category budget limits vs actuals.
 */
import { useAuth } from "../../context/AuthContext";

/**
 * BudgetLimitTable
 * Main table for managing category budget limits vs actuals.
 */
const BudgetLimitTable = ({
  rows,
  loading,
  saving,
  totalRevenue,
  totalBudget,
  totalActual,
  balance,
  pct,
  getSection,
  refSection,
  handleChange,
  handleSave,
  fmt,
}) => {
  const { activeTenant } = useAuth();
  const isGuest = activeTenant?.role === "guest";
  return (
    <section className="glass rounded-[3rem] border border-border-base overflow-hidden shadow-2xl">
      <div className="p-5 md:p-8 border-b border-border-base flex items-center justify-between bg-border-base/10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.2em]">
            Limit vs Actual Expense by Category
          </h3>
        </div>
        {!totalRevenue && (
          <Link
            to="/revenues"
            className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent hover:text-primary transition-all"
          >
            Add Revenues to unlock metrics
          </Link>
        )}
      </div>

      {loading ? (
        <div className="p-20 flex justify-center opacity-30 animate-pulse font-black uppercase text-xs tracking-widest">
          Compiling category data...
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase text-tx-muted opacity-30 tracking-widest border-b border-border-base bg-tx-primary/[0.01]">
                <th className="p-5 pl-10">Category</th>
                <th className="p-5">Structure</th>
                <th className="p-5">Set Limit</th>
                <th className="p-5">Actual Expense</th>
                <th className="p-5">Balance</th>
                <th className="p-5">Execution</th>
                {totalRevenue > 0 && <th className="p-5">% Revenue</th>}
                {!isGuest && <th className="p-5 pr-10 text-right">Commit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {rows.map((row) => (
                <BudgetTableRow
                  key={row.id}
                  row={row}
                  secObj={getSection(row.section_id)}
                  refVal={
                    refSection[getSection(row.section_id)?.name || "—"] || 0
                  }
                  onSave={handleSave}
                  onChange={handleChange}
                  isSaving={saving[row.id]}
                  totalRevenue={totalRevenue}
                  fmt={fmt}
                />
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border-base bg-tx-primary/[0.03]">
              <tr className="font-black text-tx-primary uppercase tracking-widest text-[10px]">
                <td className="p-5 pl-10" colSpan={2}>
                  Aggregate Portfolio
                </td>
                <td className="p-5">{fmt(totalBudget)}</td>
                <td className="p-5 text-yellow">{fmt(totalActual)}</td>
                <td
                  className={`p-5 ${balance < 0 ? "text-danger" : "text-success"}`}
                >
                  {fmt(balance)}
                </td>
                <td className="p-5">
                  <div className="flex items-center">
                    <span
                      className={`px-3 py-1 rounded-lg border text-[9px] whitespace-nowrap ${
                        pct >= 100
                          ? "border-danger/30 text-danger bg-danger/5"
                          : "border-success/30 text-success bg-success/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      }`}
                    >
                      {pct}% Executed
                    </span>
                  </div>
                </td>
                {totalRevenue > 0 && (
                  <td className="p-5 opacity-40 tabular-nums">
                    {((totalActual / totalRevenue) * 100).toFixed(1)}%
                  </td>
                )}
                <td className="p-5 pr-10"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
};

export default BudgetLimitTable;
