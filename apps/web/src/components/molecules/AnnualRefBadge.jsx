import React from 'react';

/**
 * AnnualRefBadge
 * Displayed in the planning banner showing annual references.
 */
const AnnualRefBadge = ({ sec, value, fmt }) => (
  <div className="bg-tx-primary/5 p-4 rounded-2xl border border-border-base group hover:border-accent/30 transition-all">
    <div className="flex items-center gap-3 mb-1">
      <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{sec.icon || '📂'}</span>
      <span className="text-[10px] font-black text-tx-muted uppercase tracking-widest leading-tight">{sec.name}</span>
    </div>
    <div className="text-lg font-black text-tx-primary tabular-nums tracking-tighter">{fmt(value)}</div>
  </div>
);

export default AnnualRefBadge;
