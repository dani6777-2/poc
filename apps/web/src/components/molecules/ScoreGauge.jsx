import React from 'react';
import Badge from '../atoms/Badge';
import { NIVEL_CFG } from '../../constants/finance';

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = a => (a - 180) * Math.PI / 180;
  const start = { x: cx + r * Math.cos(toRad(startAngle)), y: cy + r * Math.sin(toRad(startAngle)) };
  const end = { x: cx + r * Math.cos(toRad(endAngle)), y: cy + r * Math.sin(toRad(endAngle)) };
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x},${start.y} A ${r},${r} 0 ${large},1 ${end.x},${end.y}`;
}

const ScoreGauge = ({ score, level }) => {
  const cfg = NIVEL_CFG[level] || NIVEL_CFG.ok;
  const angle = (score / 100) * 180;   // semicircle 0→180°
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Critical';

  return (
    <div className="text-center py-6 flex flex-col items-center">
      <div className="relative">
        <svg width="240" height="130" viewBox="0 0 200 110" className="overflow-visible">
          {/* Track background */}
          <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-tx-primary/5" />
          {/* Score arc */}
          <path 
            d={describeArc(100, 100, 80, 0, angle)} 
            fill="none" 
            stroke="var(--cfg-color)" 
            strokeWidth="14" 
            strokeLinecap="round" 
            className="transition-all duration-1000 ease-out drop-shadow-[var(--cfg-shadow)]" 
            style={{ 
              '--cfg-color': cfg.color,
              '--cfg-shadow': `0 0 12px ${cfg.color}88` 
            }} 
          />
          {/* Center text */}
          <text x="100" y="85" textAnchor="middle" fill="currentColor" className="text-[36px] font-black text-tx-primary drop-shadow-sm">{score}%</text>
        </svg>
      </div>
      <Badge variant={level === 'ok' ? 'success' : level === 'warning' ? 'warning' : 'danger'} glow className="mt-4 px-6 tracking-[0.3em] uppercase font-black text-[10px]">
        DIAGNOSIS: {label.toUpperCase()}
      </Badge>
    </div>
  );
};

export default ScoreGauge;
