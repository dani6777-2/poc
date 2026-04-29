import React, { memo, useMemo } from 'react';
import { ConceptRow } from '../molecules';
import { Button } from '../atoms';
import { fmt } from '../../utils/formatters';

const CategoryBlock = ({ 
  category, 
  rows, 
  monthKey, 
  realMonthKey, 
  cardMonthKey,
  saving,
  onCellChange,
  onSave,
  onDelete,
  onAddConcept
}) => {
  const { autoRows, manualRows, totals } = useMemo(() => {
    const auto = rows.filter(r => r.is_automatic || r.concept_origin == 'registry');
    const manual = rows.filter(r => !r.is_automatic && r.concept_origin != 'registry');
    
    const t = rows.reduce((acc, r) => {
      acc.plan += parseFloat(r[monthKey]) || 0;
      acc.actual += parseFloat(r[realMonthKey]) || 0;
      acc.card += parseFloat(r[cardMonthKey]) || 0;
      return acc;
    }, { plan: 0, actual: 0, card: 0 });
    
    return { autoRows: auto, manualRows: manual, totals: t };
  }, [rows, monthKey, realMonthKey, cardMonthKey]);

  if (rows.length === 0) return null;

  return (
    <div className="border-b border-border-base/10 last:border-b-0">
      {/* Category Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-tx-primary/[0.01] sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-accent/40" />
          <h5 className="text-xs font-black text-tx-primary uppercase tracking-widest">{category?.name || "Unassigned"}</h5>
          <span className="text-[10px] font-bold text-tx-muted opacity-40">{rows.length} Vectors</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6 text-[11px] font-black tabular-nums">
            <span className="text-warning/80">{fmt(totals.plan)}</span>
            <span className={totals.actual + totals.card > totals.plan ? 'text-danger/80' : 'text-success/80'}>
              {fmt(totals.actual + totals.card)}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="xs"
            className="text-accent text-[9px] font-black tracking-widest uppercase px-3 h-7 rounded-full border border-accent/20 hover:bg-accent/10 transition-all flex items-center gap-1"
            onClick={() => onAddConcept(category?.id)}
          >
            <span>+</span> NEW
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-border-base/5">
            {/* Registry Block */}
            {autoRows.length > 0 && (
              <>
                <tr className="bg-tx-primary/[0.02]">
                  <td colSpan={6} className="py-1.5 px-8 text-[7px] font-black uppercase text-tx-muted tracking-[0.4em] opacity-40 flex items-center gap-2">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    Registry-Managed Structural Flows
                  </td>
                </tr>
                {autoRows.map(row => (
                  <ConceptRow 
                    key={row.id} 
                    row={row} 
                    monthKey={monthKey}
                    realMonthKey={realMonthKey}
                    cardMonthKey={cardMonthKey}
                    isSaving={saving[row.id]}
                    onCellChange={onCellChange}
                    onSave={onSave}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}

            {/* Manual Block */}
            {manualRows.length > 0 && (
              <>
                <tr className="bg-accent/[0.03]">
                  <td colSpan={6} className="py-1.5 px-8 text-[7px] font-black uppercase text-accent/60 tracking-[0.4em] flex items-center gap-2">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    Manual Budget Constraints
                  </td>
                </tr>
                {manualRows.map(row => (
                  <ConceptRow 
                    key={row.id} 
                    row={row} 
                    monthKey={monthKey}
                    realMonthKey={realMonthKey}
                    cardMonthKey={cardMonthKey}
                    isSaving={saving[row.id]}
                    onCellChange={onCellChange}
                    onSave={onSave}
                    onDelete={onDelete}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(CategoryBlock);
