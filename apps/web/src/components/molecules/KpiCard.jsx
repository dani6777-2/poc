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
    <Card interactive className={`p-8 border-none shadow-premium relative overflow-hidden group ${className}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-${variant} opacity-30`} />
      
      {badge && (
        <Badge variant={variant} glow={glow} className="mb-4 px-4 py-1.5 font-black uppercase tracking-[0.3em] text-[9px]">
          {badge}
        </Badge>
      )}
      
      {!badge && label && (
        <Text variant="caption" className="block mb-3 opacity-40 tracking-[0.4em]">
          {label}
        </Text>
      )}
      
      <Text variant="h2" className="tabular-nums drop-shadow-sm">
        {value}
      </Text>
      
      {children}
    </Card>
  );
};

export default KpiCard;
