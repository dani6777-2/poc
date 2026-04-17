import React from 'react';
import Badge from '../atoms/Badge';

const ChannelRow = ({ item, color, index, fmt }) => {
  return (
    <tr className="hover:bg-tx-primary/[0.01] transition-colors group">
      <td className="py-4 px-5 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[var(--col)]" style={{ "--col": color }} />
        <span className="text-xs font-bold text-tx-secondary group-hover:text-tx-primary transition-colors">{item.channel}</span>
        <span className="text-[9px] font-black text-accent-light opacity-30">/ {item.transactions_count} ops</span>
      </td>
      <td className="py-4 px-5 text-right tabular-nums text-sm font-black text-tx-primary">{fmt(item.total)}</td>
      <td className="py-4 px-5 text-center">
        <Badge variant="muted" className="font-black tabular-nums">{item.pct}%</Badge>
      </td>
    </tr>
  );
};

export default ChannelRow;
