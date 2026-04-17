import React from 'react';
import { Card, Badge, Text } from '../atoms';

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
    <Card 
      interactive 
      glow={glow}
      className={`p-5 lg:p-6 xl:p-8 flex flex-col relative group ${className}`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-${variant} opacity-[0.85] shadow-glow-${variant}`} />
      <div className={`absolute top-0 right-0 w-48 h-48 bg-${variant}/[0.03] rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none`} />
      
      <div className="relative z-10 flex-1 flex flex-col justify-between pt-1 pb-4 min-w-0">
        <div className="flex flex-col">
          {badge && (
            <Badge variant={variant} glow={glow} className="mb-4 px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[9px] w-fit shadow-sm bg-secondary border border-border-base/40">
              {badge}
            </Badge>
          )}
        
          {!badge && label && (
            <Text variant="caption" className="block mb-2 opacity-60 tracking-[0.4em] font-black uppercase text-[11px]">
              {label}
            </Text>
          )}
        
          <Text variant="h1" className="tabular-nums drop-shadow-sm tracking-tighter text-lg lg:text-xl xl:text-2xl font-black break-words leading-none">
            {value}
          </Text>
        </div>
        
        {children && (
          <div className="relative z-10 w-full mt-auto pt-4">
            {children}
          </div>
        )}
      </div>
    </Card>
  );
};

export default KpiCard;