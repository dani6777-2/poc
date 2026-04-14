import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import VarBadge from '../molecules/VarBadge';

const ExpenseMatrixRow = ({ 
  row, 
  auto, 
  monthKey, 
  realMonthKey, 
  cardMonthKey, 
  saving, 
  handleCellChange, 
  setConfirmId, 
  fmt 
}) => {
  const planV = parseFloat(row[monthKey]) || 0;
  const actualV = parseFloat(row[realMonthKey]) || 0;
  const cardV = parseFloat(row[cardMonthKey]) || 0;

  return (
    <tr className={`hover:bg-tx-primary/[0.04] transition-all group ${auto ? 'bg-accent/[0.03]' : ''} h-20`}>
      <td className="p-5 pl-10">
        <div className="flex items-center gap-4">
          {saving[row.id] ? <div className="w-3 h-3 rounded-full bg-accent animate-ping" /> : <div className="w-3 h-3 rounded-full bg-tx-primary/10 group-hover:bg-accent/40" />}
          <div className="flex flex-col">
              <span className={`text-base font-black tracking-tight leading-none uppercase group-hover:text-accent transition-colors ${auto ? 'italic text-tx-muted mb-1' : 'text-tx-primary'}`}>{row.description}</span>
              <span className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30 mt-1.5">{auto ? "SYNC_STREAM_ACTIVE" : "MANUAL_ENTRY_IO"}</span>
          </div>
          {auto && <Badge variant="accent" glow className="scale-75 origin-left font-black tracking-widest text-[8px] px-2 py-0.5 shadow-glow-accent/20">AUT</Badge>}
        </div>
      </td>
      <td className="p-3 text-right">
        {auto ? <span className="text-sm font-black text-warning/50 px-5 tabular-nums tracking-tighter">{planV > 0 ? fmt(planV) : '—'}</span> : (
            <input 
              type="number" 
              value={row[monthKey] || ''} 
              onChange={e => handleCellChange(row.id, monthKey, e.target.value)}
              className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-accent/5 focus:ring-2 focus:ring-accent/20 rounded-[1rem] px-5 text-right text-sm font-black text-warning outline-none transition-all [appearance:textfield] tracking-tighter" 
              placeholder="$0" 
            />
        )}
      </td>
      <td className="p-3 text-right">
          <input 
            type="number" 
            value={row[realMonthKey] || ''} 
            onChange={e => handleCellChange(row.id, realMonthKey, e.target.value)}
            className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-purple/5 focus:ring-2 focus:ring-purple/20 rounded-[1rem] px-5 text-right text-sm font-black text-purple outline-none transition-all [appearance:textfield] tracking-tighter" 
            placeholder="$0" 
          />
      </td>
      <td className="p-3 text-right">
          <input 
            type="number" 
            value={row[cardMonthKey] || ''} 
            onChange={e => handleCellChange(row.id, cardMonthKey, e.target.value)}
            className="w-full h-12 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.05] focus:bg-danger/5 focus:ring-2 focus:ring-danger/20 rounded-[1rem] px-5 text-right text-sm font-black text-danger outline-none transition-all [appearance:textfield] tracking-tighter" 
            placeholder="$0" 
          />
      </td>
      <td className="p-5 text-right"><VarBadge plan={planV} actual={actualV} /></td>
      <td className="p-5 text-right">
        {!auto && (
            <Button 
                variant="ghost" 
                className="p-3 rounded-xl text-tx-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all" 
                onClick={() => setConfirmId(row.id)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
            </Button>
        )}
      </td>
    </tr>
  );
};

export default ExpenseMatrixRow;
