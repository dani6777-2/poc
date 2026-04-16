with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/KpiCard.jsx', 'r') as f:
    text = f.read()

new_card = """import React from 'react';
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
      className={`p-6 md:p-8 flex flex-col border border-border-base shadow-md relative bg-secondary hover:shadow-lg transition-all duration-500 rounded-[2rem] overflow-hidden group ${className}`}
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-${variant} opacity-[0.85] shadow-glow-${variant}`} />
      <div className={`absolute top-0 right-0 w-48 h-48 bg-${variant}/[0.03] rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none`} />
      
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {badge && (
          <Badge variant={variant} glow={glow} className="mb-5 px-5 py-2 font-black uppercase tracking-[0.3em] text-[10px] w-fit shadow-sm bg-secondary border border-border-base/40">
            {badge}
          </Badge>
        )}
        
        {!badge && label && (
          <Text variant="caption" className="block mb-3 opacity-60 tracking-[0.4em] font-black uppercase text-[11px]">
            {label}
          </Text>
        )}
        
        <Text variant="h1" className="tabular-nums drop-shadow-sm tracking-tighter text-4xl lg:text-5xl font-black">
          {value}
        </Text>
      </div>
      
      {children && (
        <div className="relative z-10 w-full mt-auto pt-6">
          {children}
        </div>
      )}
    </Card>
  );
};

export default KpiCard;"""

with open('/Users/PERSONAL/Documents/poc/apps/web/src/components/molecules/KpiCard.jsx', 'w') as f:
    f.write(new_card)
