import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

/**
 * RevenueMatrixRow
 * Individual row for the annual revenue streams matrix.
 */
const RevenueMatrixRow = ({ 
  row, 
  MONTH_KEYS, 
  onCellChange, 
  onDeleteRequest, 
  isSaving, 
  totalRow, 
  fmt 
}) => {
  return (
    <tr className="hover:bg-tx-primary/[0.02] transition-colors group h-20">
      <td className="p-6 font-black text-[13px] text-tx-primary sticky left-0 z-10 bg-secondary border-r border-border-base/40 shadow-2xl">
        <div className="flex items-center gap-5">
           <div className={`w-3 h-3 rounded-full transition-all ${isSaving ? 'bg-accent animate-ping' : 'bg-tx-primary/10 group-hover:bg-success/50 shadow-glow-success'}`} />
           <span className="group-hover:text-success transition-colors uppercase tracking-[0.15em] shrink-0">{row.source}</span>
           {isSaving && <Badge variant="accent" size="sm" className="scale-90 origin-left font-black tracking-widest text-[8px]">SYNC</Badge>}
        </div>
      </td>
      {MONTH_KEYS.map(m => (
        <td key={m} className="p-3">
          <input
            type="number"
            className="w-full bg-tx-primary/[0.03] hover:bg-tx-primary/[0.06] focus:bg-tx-primary/[0.1] focus:ring-2 focus:ring-accent-light/30 border-none rounded-2xl p-4 text-right font-black text-sm text-tx-primary transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={row[m] || ''}
            onChange={e => onCellChange(row.id, m, e.target.value)}
            placeholder="0"
          />
        </td>
      ))}
      <td className="p-6 text-right font-black text-base text-success bg-tx-primary/[0.02] tabular-nums tracking-tighter">
        {fmt(totalRow(row))}
      </td>
      <td className="p-6 bg-tx-primary/[0.02]">
        <Button 
          variant="ghost" 
          size="sm"
          className="w-12 h-12 p-0 text-tx-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-all"
          onClick={() => onDeleteRequest(row.id)}
        >
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
        </Button>
      </td>
    </tr>
  );
};

export default RevenueMatrixRow;
