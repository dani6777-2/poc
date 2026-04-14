import React from 'react';
import { Link } from 'react-router-dom';
import AnnualRefBadge from '../molecules/AnnualRefBadge';

/**
 * AnnualPlanningBanner
 * Banner showing annual planned expenses reference for sections.
 */
const AnnualPlanningBanner = ({ sectionsWithRef, refSection, month, fmt }) => {
  if (sectionsWithRef.length === 0) return null;

  return (
    <div className="glass p-6 rounded-[2rem] border border-accent/20 bg-accent/5 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Planned in Annual Expenses ({month})</h3>
        <Link to="/annual-expenses" className="text-[10px] font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all">View Full Worksheet →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {sectionsWithRef.map(sec => (
          <AnnualRefBadge 
            key={sec.id} 
            sec={sec} 
            value={refSection[sec.name]} 
            fmt={fmt} 
          />
        ))}
      </div>
    </div>
  );
};

export default AnnualPlanningBanner;
