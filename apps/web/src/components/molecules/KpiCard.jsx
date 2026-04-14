import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

const KpiCard = ({ 
  label, 
  value, 
  badge, 
  variant = "info", 
  glow = false, 
  className = "", 
  children 
}) => {
  return (
    <Card interactive className={`p-8 border-none shadow-premium relative overflow-hidden group ${className}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-${variant} opacity-30`} />
      
      {badge && (
        <Badge variant={variant} glow={glow} className="mb-4 px-4 py-1.5 font-black uppercase tracking-[0.3em] text-[9px]">
          {badge}
        </Badge>
      )}
      
      {!badge && label && (
        <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.4em] block mb-3 opacity-40">
          {label}
        </label>
      )}
      
      <div className={`text-2xl md:text-3xl font-black text-tx-primary tabular-nums tracking-tighter drop-shadow-sm`}>
        {value}
      </div>
      
      {children}
    </Card>
  );
};

export default KpiCard;
