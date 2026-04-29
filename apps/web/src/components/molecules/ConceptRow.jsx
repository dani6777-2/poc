import React, { memo } from 'react';
import { Badge } from '../atoms';
import { fmt } from '../../utils/formatters';

/**
 * ConceptRow Component (v5.0)
 * Represents a single financial vector (concept) within a category.
 */
const ConceptRow = ({ 
  row, 
  monthKey, 
  realMonthKey, 
  cardMonthKey, 
  isSaving, 
  onCellChange, 
  onSave, 
  onDelete 
}) => {
  const isSystem = !!(row.is_automatic || row.concept_origin == 'registry');
  const label = row.concept_label || row.description || "—";
  
  const planV = parseFloat(row[monthKey]) || 0;
  const actualV = parseFloat(row[realMonthKey]) || 0;
  const cardV = parseFloat(row[cardMonthKey]) || 0;
  const totalExec = actualV + cardV;
  const diff = planV - totalExec;

  const inputClasses = "w-full h-10 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-accent/5 focus:ring-2 focus:ring-accent/20 rounded-xl px-4 text-right text-sm font-bold outline-none transition-all tabular-nums";

  return (
    <tr className={`group transition-all h-14 ${isSystem ? 'bg-tx-primary/[0.01] italic' : 'hover:bg-tx-primary/[0.02]'}`}>
      <td className="p-3 pl-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isSaving ? (
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            ) : (
              <div className={`w-2.5 h-2.5 rounded-full ${isSystem ? 'bg-tx-muted/30' : 'bg-tx-primary/10 group-hover:bg-accent/40'}`} />
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className={`text-sm font-black tracking-tight truncate uppercase ${isSystem ? 'text-tx-muted' : 'text-tx-primary'}`}>
              {label}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {isSystem ? (
                <Badge variant="muted" className="text-[7px] px-1.5 py-0 shadow-none opacity-60 bg-tx-muted/10 flex items-center gap-1">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  REGISTRY
                </Badge>
              ) : (
                <span className="text-[8px] font-black text-tx-muted uppercase tracking-widest opacity-20">MANUAL</span>
              )}
              {row.concept_key && (
                <span className="text-[7px] font-mono text-tx-muted opacity-20 truncate max-w-[100px]">
                  {row.concept_key}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* PLAN COLUMN */}
      <td className="p-2 w-36">
        {isSystem ? (
          <div className="text-right pr-4 text-sm font-bold text-warning/60 tabular-nums">
            {planV > 0 ? fmt(planV) : "—"}
          </div>
        ) : (
          <input
            type="number"
            value={row[monthKey] ?? ""}
            onChange={(e) => onCellChange(row.id, monthKey, e.target.value)}
            onBlur={() => onSave(row.id)}
            className={`${inputClasses} text-warning`}
            placeholder="0"
          />
        )}
      </td>

      {/* ACTUAL COLUMN */}
      <td className="p-2 w-36">
        {isSystem ? (
          <div className="text-right pr-4 text-sm font-bold text-purple/60 tabular-nums">
            {actualV > 0 ? fmt(actualV) : "—"}
          </div>
        ) : (
          <input
            type="number"
            value={row[realMonthKey] ?? ""}
            onChange={(e) => onCellChange(row.id, realMonthKey, e.target.value)}
            onBlur={() => onSave(row.id)}
            className={`${inputClasses} text-purple`}
            placeholder="0"
          />
        )}
      </td>

      {/* CARD COLUMN */}
      <td className="p-2 w-36">
        {isSystem ? (
          <div className="text-right pr-4 text-sm font-bold text-danger/60 tabular-nums">
            {cardV > 0 ? fmt(cardV) : "—"}
          </div>
        ) : (
          <input
            type="number"
            value={row[cardMonthKey] ?? ""}
            onChange={(e) => onCellChange(row.id, cardMonthKey, e.target.value)}
            onBlur={() => onSave(row.id)}
            className={`${inputClasses} text-danger`}
            placeholder="0"
          />
        )}
      </td>

      {/* DIFF COLUMN */}
      <td className="p-2 text-right pr-6 w-32">
        <div className={`text-xs font-black tabular-nums ${diff >= 0 ? 'text-success/70' : 'text-danger/70'}`}>
          {fmt(diff)}
        </div>
      </td>

      {/* ACTIONS */}
      <td className="p-2 w-16 text-center">
        {!isSystem && (
          <button 
            onClick={() => onDelete(row.id)}
            className="p-2 text-tx-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6" /></svg>
          </button>
        )}
      </td>
    </tr>
  );
};

export default memo(ConceptRow);
