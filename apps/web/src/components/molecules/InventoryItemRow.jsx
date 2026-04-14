import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

/**
 * InventoryItemRow
 * Shared row component for Block A and Block B tables.
 */
const InventoryItemRow = ({ 
  item, 
  onEdit, 
  onDelete, 
  fmt,
  type = 'block-a' 
}) => {
  // Logic from Block A
  const diffA = item.prev_month_price ? (item.unit_price - item.prev_month_price) : null;
  // Logic from Block B
  const deltaB = item.delta_precio || 0;
  const hasDeltaB = item.prev_month_price && item.prev_month_price > 0;

  return (
    <tr className="hover:bg-tx-primary/[0.01] transition-colors group">
      <td className="p-6 pl-10">
        <div className="text-xs font-black text-tx-primary group-hover:text-tx-primary transition-colors uppercase tracking-widest leading-none mb-1">
          {item.name}
        </div>
        <div className="text-[8px] font-black text-tx-muted uppercase tracking-[0.2em] opacity-30">
          {type === 'block-a' ? 'ID_REF: ' : 'BATCH_ID: '}
          {item.id.toString(16).toUpperCase()}
        </div>
      </td>
      <td className="p-6 text-center">
        <Badge variant="muted" size="sm" className="font-black px-3">{item.category_name}</Badge>
      </td>
      <td className="p-6 text-center">
        <Badge variant="muted" size="sm" className="font-black px-3">
          {type === 'block-a' ? (item.unit_name || 'N/A') : (item.unit_name || 'Kg')}
        </Badge>
      </td>

      {type === 'block-a' ? (
        <td className="p-6 text-center font-black tabular-nums text-sm">{item.quantity || '0'}</td>
      ) : null}

      <td className="p-6">
        <span className="text-[10px] font-bold text-tx-muted uppercase truncate block opacity-60">
          {item.channel_name || (type === 'block-a' ? 'DIRECT_FEED' : 'PUBLIC_MARKET')}
        </span>
      </td>

      <td className="p-6 text-right font-black tabular-nums text-sm text-tx-secondary">
        {type === 'block-a' ? (item.unit_price ? fmt(item.unit_price) : '—') : fmt(item.price_per_kg)}
      </td>
      
      <td className="p-6 text-right font-black tabular-nums text-base text-tx-primary drop-shadow-glow-muted">
        {fmt(item.subtotal)}
      </td>

      <td className="p-6 text-center">
        {type === 'block-a' ? (
          item.prev_month_price ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-black text-tx-muted opacity-20">{fmt(item.prev_month_price)}</span>
              {diffA !== null && (
                <div className={`text-[10px] font-black flex items-center gap-1 ${diffA > 0 ? 'text-danger' : 'text-success'}`}>
                  {diffA > 0 ? '▲' : '▼'} {fmt(Math.abs(diffA))}
                </div>
              )}
            </div>
          ) : <Badge variant="accent" size="sm" className="scale-75 opacity-30">NEW_NODE</Badge>
        ) : (
          hasDeltaB ? (
            <Badge variant={deltaB > 0 ? 'danger' : deltaB < 0 ? 'success' : 'muted'} className="px-4 tracking-tighter">
               {deltaB > 0 ? '▲ INC' : deltaB < 0 ? '▼ DEC' : 'STABLE'} {fmt(Math.abs(deltaB))}
            </Badge>
          ) : <span className="text-[10px] font-black text-tx-muted opacity-10 uppercase tracking-widest">UNTRACKED</span>
        )}
      </td>

      <td className="p-6 text-right pr-10">
        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="w-9 h-9 p-0 rounded-lg hover:bg-accent/10 hover:text-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="w-9 h-9 p-0 rounded-lg hover:bg-danger/10 hover:text-danger">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default InventoryItemRow;
