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
  onToggleStatus,
  fmt,
  type = 'block-a'
}) => {
  const accentColor = type === 'block-a' ? 'text-accent' : 'text-success';
  const bgColor = type === 'block-a' ? 'bg-accent' : 'bg-success';
  const shadowGlow = type === 'block-a' ? 'shadow-glow-accent' : 'shadow-glow-success';

  return (
    <section key={secName} className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <div className={`w-2 h-7 ${bgColor} rounded-full ${shadowGlow}`} />
          <div>
            <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.3em] flex items-center gap-3">
              {secIcon && <span className="text-lg opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">{secIcon}</span>}
              {secName}
            </h3>
            <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-40 ${accentColor}`}>Active Segment Control</div>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[9px] font-black text-tx-muted uppercase tracking-widest opacity-30 leading-none mb-1.5">Segment Contribution</div>
            <span className="text-lg font-black text-tx-primary tabular-nums tracking-tighter">{fmt(secTotal)}</span>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden shadow-2xl border border-border-base/40 bg-secondary/40 backdrop-blur-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase text-tx-muted/30 tracking-[0.3em] border-b border-border-base bg-tx-primary/[0.03]">
                <th className="p-7 pl-10">Asset Descriptor</th>
                <th className="p-7 text-center w-28">Category</th>
                <th className="p-7 text-center w-28">Unit</th>
                {type === 'block-a' && <th className="p-7 text-center w-28">Current Load</th>}
                <th className="p-7 w-36">Channel/Source</th>
                <th className="p-7 text-right w-40">{type === 'block-a' ? 'Entry Price' : 'Unit Price'}</th>
                <th className="p-7 text-right w-40 font-black text-tx-primary">{type === 'block-a' ? 'Matrix Value' : 'Subtotal'}</th>
                <th className="p-7 text-center w-36">{type === 'block-a' ? 'Volatility' : 'Price Delta'}</th>
                <th className="p-7 pr-10 text-right w-28">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40">
              {secItems.map(item => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleStatus}
                  fmt={fmt}
                  type={type}
                />
              ))}
            </tbody>
            <tfoot className="bg-tx-primary/[0.05] text-[10px] font-black uppercase tracking-[0.3em] text-tx-muted/50 border-t border-border-base/60">
              <tr>
                <td className="p-7 pl-10" colSpan={type === 'block-a' ? 6 : 5}>
                  {type === 'block-a' ? 'Aggregate Segment Contribution' : 'Aggregate Market Segment Value'}
                </td>
                <td className="p-7 text-right text-tx-primary text-xl font-black tracking-tighter drop-shadow-glow-muted">
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
