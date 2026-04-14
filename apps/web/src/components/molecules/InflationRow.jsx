import React from 'react';

const InflationRow = ({ item, fmt }) => {
  return (
    <tr className="group hover:bg-tx-primary/[0.01] transition-colors">
      <td className="py-4">
        <div className="text-xs font-black text-tx-primary group-hover:text-tx-primary truncate transition-colors">{item.name}</div>
        <div className="text-[9px] text-tx-muted font-bold uppercase opacity-30 mt-0.5">Base Hist: {fmt(item.prev_month_price)}</div>
      </td>
      <td className="py-4 text-right tabular-nums text-xs font-black text-tx-secondary">{fmt(item.current_price)}</td>
      <td className="py-4 text-right pr-4 tabular-nums">
        <div className={`text-xs font-black inline-flex items-center gap-1.5 ${item.variation_pct > 0 ? 'text-danger' : 'text-success'}`}>
          {item.variation_pct > 0 ? '▲' : '▼'}
          {Math.abs(item.variation_pct).toFixed(1)}%
        </div>
      </td>
    </tr>
  );
};

export default InflationRow;
