import React from 'react';
import Card from '../atoms/Card';
import InventoryItemRow from '../molecules/InventoryItemRow';

/**
 * InventorySection
 * Handles the rendering of one section (e.g. "Proteins") in the inventory table.
 */
const InventorySection = ({ 
  secName, 
  secTotal, 
  secIcon,
  secItems, 
  onEdit, 
  onDelete, 
  fmt,
  type = 'block-a' 
}) => {
  const accentColor = type === 'block-a' ? 'bg-accent' : 'bg-success';
  const shadowGlow = type === 'block-a' ? 'shadow-glow-accent' : 'shadow-glow-success';

  return (
    <section key={secName} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-6 ${accentColor} rounded-full ${shadowGlow}`} />
          <h3 className="text-[13px] font-black text-tx-primary uppercase tracking-[0.3em] flex items-center gap-3">
            {secIcon && <span className="opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">{secIcon}</span>}
            {secName}
          </h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] font-black text-tx-muted uppercase tracking-widest opacity-30 leading-none mb-1">Segment Total</div>
            <span className="text-sm font-black text-tx-primary tabular-nums">{fmt(secTotal)}</span>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black uppercase text-tx-muted/30 tracking-[0.3em] border-b border-border-base bg-tx-primary/[0.02]">
                <th className="p-6 pl-10">Asset / SKU Descriptor</th>
                <th className="p-6 text-center w-24">Category</th>
                <th className="p-6 text-center w-24">Unit</th>
                {type === 'block-a' && <th className="p-6 text-center w-24">Load</th>}
                <th className="p-6 w-32">Channel/Source</th>
                <th className="p-6 text-right w-36">{type === 'block-a' ? 'Entry Price' : 'Unit Price'}</th>
                <th className="p-6 text-right w-36">{type === 'block-a' ? 'Matrix Value' : 'Subtotal'}</th>
                <th className="p-6 text-center w-32">{type === 'block-a' ? 'Volatility' : 'Price Delta'}</th>
                <th className="p-6 pr-10 text-right w-24">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {secItems.map(item => (
                <InventoryItemRow 
                  key={item.id} 
                  item={item} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  fmt={fmt} 
                  type={type} 
                />
              ))}
            </tbody>
            <tfoot className="bg-tx-primary/[0.04] text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted/50 border-t border-border-base">
              <tr>
                <td className="p-6 pl-10" colSpan={type === 'block-a' ? 6 : 5}>
                  {type === 'block-a' ? 'Aggregate Segment Contribution' : 'Aggregate Market Segment Value'}
                </td>
                <td className="p-6 text-right text-tx-primary text-base tracking-tighter drop-shadow-glow-muted">
                  {fmt(secTotal)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </section>
  );
};

export default InventorySection;
