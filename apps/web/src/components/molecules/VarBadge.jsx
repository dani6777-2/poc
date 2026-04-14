import React from 'react';
import Badge from '../atoms/Badge';
import { fmt } from '../../utils/formatters';

const VarBadge = ({ plan, actual }) => {
  if (!plan && !actual) return <span className="text-tx-muted text-[10px] opacity-20">—</span>;
  
  const diff = plan - actual;
  const ok = diff >= 0;
  
  return (
    <Badge 
      variant={ok ? 'success' : 'danger'} 
      glow={!ok} 
      className="font-black px-3 py-1 text-[10px]"
    >
      {ok ? '▲' : '▼'} {fmt(Math.abs(diff))}
    </Badge>
  );
};

export default VarBadge;
