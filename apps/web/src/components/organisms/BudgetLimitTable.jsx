import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../atoms/Card';
import BudgetTableRow from '../molecules/BudgetTableRow';

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
  fmt 
}) => {
  return (
    <section className="glass rounded-[3rem] border border-border-base overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-border-base flex items-center justify-between bg-border-base/10">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.2em]">Limit vs Actual Expense by Category</h3>
         </div>
         {!totalRevenue && (
           <Link to="/revenues" className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent hover:text-primary transition-all">
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
                <th className="p-6 pl-10">Category</th>
                <th className="p-6">Structure</th>
                <th className="p-6">Set Limit</th>
                <th className="p-6">Actual Expense</th>
                <th className="p-6">Balance</th>
                <th className="p-6">Execution</th>
                {totalRevenue > 0 && <th className="p-6">% Revenue</th>}
                <th className="p-6 pr-10 text-right">Commit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {rows.map(row => (
                <BudgetTableRow 
                  key={row.id}
                  row={row}
                  secObj={getSection(row.section_id)}
                  refVal={refSection[getSection(row.section_id)?.name || '—'] || 0}
                  onSave={handleSave}
                  onChange={handleChange}
                  isSaving={saving[row.id]}
                  totalRevenue={totalRevenue}
                  fmt={fmt}
                />
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border-base bg-tx-primary/[0.02]">
              <tr className="font-black text-tx-primary uppercase tracking-widest text-xs">
                <td className="p-8 pl-10" colSpan={2}>Aggregate Portfolio</td>
                <td className="p-8">{fmt(totalBudget)}</td>
                <td className="p-8 text-yellow">{fmt(totalActual)}</td>
                <td className={`p-8 ${balance < 0 ? 'text-danger' : 'text-success'}`}>{fmt(balance)}</td>
                <td className="p-8">
                   <span className={`px-4 py-1.5 rounded-xl border ${pct >= 100 ? 'border-danger text-danger bg-danger/5' : 'border-success text-success bg-success/5'}`}>
                      {pct}% Executed
                   </span>
                </td>
                {totalRevenue > 0 && <td className="p-8 opacity-40">{(totalActual / totalRevenue * 100).toFixed(1)}%</td>}
                <td className="p-8 pr-10"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
};

export default BudgetLimitTable;
