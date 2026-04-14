import React from 'react';

const HealthScore = ({ score }) => {
  const color = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle 
          className="text-tx-primary/5" 
          cx="50" 
          cy="50" 
          r="42" 
          stroke="currentColor" 
          strokeWidth="10" 
          fill="transparent" 
        />
        <circle
          className="transition-all duration-1000 ease-out"
          cx="50" 
          cy="50" 
          r="42"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          fill="transparent"
          style={{
            strokeDasharray: '263.9',
            strokeDashoffset: 263.9 - (263.9 * score) / 100,
            filter: `drop-shadow(0 0 12px ${color}66)`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-tx-primary leading-none tracking-tighter">
          {score}
        </span>
        <span className="text-[10px] text-tx-muted font-black uppercase tracking-[0.2em] mt-2 opacity-50">
          Score
        </span>
      </div>
    </div>
  );
};

export default HealthScore;
