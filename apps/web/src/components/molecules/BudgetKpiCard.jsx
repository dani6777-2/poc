import React from 'react';

/**
 * BudgetKpiCard
 * Individual stat card for the budget dashboard.
 */
const BudgetKpiCard = ({ 
  label, 
  value, 
  subtitle, 
  variant = 'default',
  highlight = false,
  progress = null,
  progressVariant = 'accent'
}) => {
  const valueColorClass = {
    default: 'text-tx-primary',
    success: 'text-success',
    yellow: 'text-yellow',
    danger: 'text-danger'
  }[variant] || 'text-tx-primary';

  return (
    <div className={`glass p-6 rounded-[2rem] border border-border-base space-y-1 relative overflow-hidden group ${highlight ? 'border-white/5' : ''}`}>
       {highlight && (
         <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-700 ${variant === 'danger' ? 'bg-danger' : 'bg-success'}`} />
       )}
       
       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <div className="text-[10px] font-black text-tx-muted uppercase tracking-widest opacity-40">{label}</div>
             <div className={`text-2xl font-black ${valueColorClass} tabular-nums tracking-tighter ${variant === 'danger' && highlight ? 'animate-pulse' : ''}`}>
                {value}
             </div>
             {subtitle && (
               <p className="text-[9px] font-bold text-tx-secondary uppercase tracking-tighter">{subtitle}</p>
             )}
          </div>
          
          {progress !== null && (
            <div className={`text-sm font-black tabular-nums ${progress >= 100 ? 'text-danger' : progress >= 80 ? 'text-yellow' : 'text-success'}`}>
              {progress}%
            </div>
          )}
       </div>

       {progress !== null && (
         <div className="h-2 bg-tx-primary/5 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-danger' : `bg-${progressVariant}`}`} 
              style={{ width: `${Math.min(progress, 100)}%` }} 
            />
         </div>
       )}
    </div>
  );
};

export default BudgetKpiCard;
