import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

/**
 * RevenueFlowCard
 * Specialized stat card for Revenue page metrics.
 */
const RevenueFlowCard = ({ 
  label, 
  value, 
  variant = 'default', 
  badge = null, 
  subtitle = null,
  children 
}) => {
  const accentColorClass = {
    success: 'bg-success/20',
    accent: 'bg-accent/20',
    default: 'bg-tx-primary/5'
  }[variant] || 'bg-tx-primary/5';

  const valueColorClass = {
    success: 'text-success drop-shadow-glow-success',
    accent: 'text-accent-light',
    default: 'text-tx-primary'
  }[variant] || 'text-tx-primary';

  return (
    <Card interactive className="p-8 flex flex-col items-center text-center shadow-premium border-none relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColorClass}`} />
      <label className="text-[10px] uppercase font-black tracking-[0.3em] text-tx-muted mb-4 opacity-40">{label}</label>
      <span className={`text-4xl font-black ${valueColorClass} tabular-nums tracking-tighter`}>{value}</span>
      {badge && (
        <Badge variant={variant === 'default' ? 'muted' : variant} size="sm" className="mt-5 opacity-40 tracking-[0.3em] uppercase font-black text-[9px]">
          {badge}
        </Badge>
      )}
      {subtitle && (
        <p className="text-[9px] font-black text-tx-muted mt-5 opacity-30 uppercase tracking-[0.4em] italic leading-none">{subtitle}</p>
      )}
      {children}
    </Card>
  );
};

export default RevenueFlowCard;
