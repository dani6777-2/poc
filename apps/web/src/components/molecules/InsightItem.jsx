import React from 'react';

const InsightItem = ({ insight, index }) => {
  const typeStyles = {
    warning: 'border-danger',
    success: 'border-success',
    info: 'border-accent'
  }[insight.type] || 'border-accent';

  const typeIcon = {
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️'
  }[insight.type] || 'ℹ️';

  return (
    <div className={`flex gap-5 p-6 rounded-3xl border-l-8 transition-all duration-500 bg-tx-primary/[0.02] hover:bg-tx-primary/[0.06] shadow-xl group/ins ${typeStyles}`}>
      <div className="text-3xl group-hover/ins:scale-110 transition-transform">
        {typeIcon}
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm font-black text-tx-primary leading-tight uppercase tracking-tight group-hover/ins:text-accent transition-colors">
          {insight.message}
        </div>
        <div className="text-[11px] text-tx-muted font-black uppercase tracking-[0.2em] opacity-40">
          {insight.value}
        </div>
      </div>
    </div>
  );
};

export default InsightItem;
