import React from 'react';
import { Card } from '../atoms';

const StatBox = ({ label, value, subtext, variant = 'accent', icon }) => {
  const variants = {
    accent: 'text-accent border-accent/20 bg-accent/5',
    success: 'text-success border-success/20 bg-success/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    danger: 'text-danger border-danger/20 bg-danger/5',
    purple: 'text-purple border-purple/20 bg-purple/5',
    info: 'text-info border-info/20 bg-info/5',
  };

  return (
    <Card className={`p-6 border flex flex-col gap-1 relative overflow-hidden group hover:shadow-premium transition-all duration-300 ${variants[variant] || variants.accent}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon || <div className="w-12 h-12 rounded-full bg-current" />}
      </div>
      
      <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{label}</label>
      <div className="text-3xl font-black tabular-nums tracking-tighter drop-shadow-sm">{value}</div>
      {subtext && <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-1">{subtext}</div>}
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-current opacity-20" />
    </Card>
  );
};

export default StatBox;
