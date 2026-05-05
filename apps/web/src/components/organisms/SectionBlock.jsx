import React, { memo } from 'react';
import { Card, Badge } from '../atoms';
import CategoryBlock from './CategoryBlock';
import { fmt } from '../../utils/formatters';

const SectionBlock = ({ 
  section, 
  categories, 
  rowsBySection, 
  monthKey, 
  realMonthKey, 
  cardMonthKey,
  collapsed,
  onToggleCollapse,
  saving,
  onCellChange,
  onSave,
  onDelete,
  onAddConcept
}) => {
  const secRows = rowsBySection[section.id] || [];
  const color = section.color_accent || '#6366f1';
  
  const secTotals = secRows.reduce((acc, r) => {
    acc.plan += parseFloat(r[monthKey]) || 0;
    acc.actual += parseFloat(r[realMonthKey]) || 0;
    acc.card += parseFloat(r[cardMonthKey]) || 0;
    return acc;
  }, { plan: 0, actual: 0, card: 0 });

  return (
    <Card 
      className="overflow-hidden border border-border-base shadow-lg bg-secondary border-l-[10px] transition-all duration-500 rounded-3xl"
      style={{ borderLeftColor: color }}
    >
      {/* Section Header */}
      <div 
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors sticky top-0 z-20 bg-secondary/80 backdrop-blur-md"
        onClick={() => onToggleCollapse(section.id)}
      >
        <div className="flex items-center gap-5">
          <span className="text-3xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all">
            {section.icon || "📂"}
          </span>
          <div>
            <h3 className="text-sm font-black text-tx-primary uppercase tracking-[0.2em]">{section.name}</h3>
            <Badge variant="muted" size="sm" className="mt-1 opacity-40 font-black tracking-widest text-[8px]">
              ID: {section.id}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-10 items-center">
          <div className="hidden md:flex gap-10 text-right">
            <div>
              <span className="text-[9px] font-black text-tx-muted uppercase tracking-widest opacity-40 block mb-0.5">PLAN</span>
              <span className="text-warning font-black tracking-tighter text-lg">{fmt(secTotals.plan)}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-tx-muted uppercase tracking-widest opacity-40 block mb-0.5">ACTUAL</span>
              <span className={`font-black tracking-tighter text-lg ${secTotals.actual > secTotals.plan ? 'text-danger' : 'text-success'}`}>
                {fmt(secTotals.actual)}
              </span>
            </div>
          </div>
          
          <div className={`text-tx-muted transition-transform duration-500 p-2 ${collapsed ? '' : 'rotate-90'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-border-base/40 animate-in fade-in slide-in-from-top-2 duration-300">
          {categories.filter(c => c.section_id == section.id).map(cat => (
            <CategoryBlock 
              key={cat.id}
              category={cat}
              rows={secRows.filter(r => r.category_id == cat.id)}
              monthKey={monthKey}
              realMonthKey={realMonthKey}
              cardMonthKey={cardMonthKey}
              saving={saving}
              onCellChange={onCellChange}
              onSave={onSave}
              onDelete={onDelete}
              onAddConcept={(catId) => onAddConcept(section.id, catId)}
            />
          ))}
          
          {/* Unassigned Legacy Block */}
          {secRows.filter(r => !r.category_id).length > 0 && (
            <CategoryBlock 
              category={{ name: "Unassigned (Legacy)", id: null }}
              rows={secRows.filter(r => !r.category_id)}
              monthKey={monthKey}
              realMonthKey={realMonthKey}
              cardMonthKey={cardMonthKey}
              saving={saving}
              onCellChange={onCellChange}
              onSave={onSave}
              onDelete={onDelete}
              onAddConcept={(catId) => onAddConcept(section.id, catId)}
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default memo(SectionBlock);
