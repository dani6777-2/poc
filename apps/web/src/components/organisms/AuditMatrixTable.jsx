import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

const AuditMatrixTable = ({ sections }) => {
  return (
    <Card className="overflow-hidden shadow-premium border-none">
      <div className="p-12 border-b border-border-base bg-tx-primary/[0.01]">
          <h3 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.4em]">Sectoral Audit Matrix</h3>
          <p className="text-[10px] font-bold text-tx-muted uppercase tracking-widest mt-2 opacity-30">Validation criteria applied to global sustainability analysis</p>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black uppercase text-tx-muted opacity-40 border-b border-border-base bg-tx-primary/[0.02] tracking-[0.4em]">
              <th className="p-10 pl-14">Sector Metric</th>
              <th className="p-10 text-right">GREEN ZONE ✓</th>
              <th className="p-10 text-right">AMBER ZONE ⚠️</th>
              <th className="p-10 text-right">RED ZONE 🚨</th>
              <th className="p-10 pl-14">Regulatory Framework</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {sections.map(s => {
              return (
                <tr key={s.section} className="transition-all hover:bg-tx-primary/[0.02] group">
                  <td className="p-8 pl-14">
                     <div className="flex items-center gap-8">
                        <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-700">{s.icon}</span>
                        <div className="flex flex-col">
                           <span className="text-base font-black text-tx-primary uppercase tracking-widest">{s.section}</span>
                           <Badge variant="muted" size="sm" className="w-fit mt-2 opacity-30 font-black text-[8px] tracking-[0.2em]">ISO_SAFE_302</Badge>
                        </div>
                     </div>
                  </td>
                  <td className="p-10 text-right font-black text-success tabular-nums tracking-tighter text-xl drop-shadow-sm">
                    {s.invert ? `≥ ${s.min_ok}%` : `≤ ${s.max_ok}%`}
                  </td>
                  <td className="p-10 text-right font-black text-warning tabular-nums tracking-tighter text-xl opacity-60">
                    {s.invert ? `${s.min_warning}–${s.min_ok}%` : `${s.max_ok}–${s.max_warning}%`}
                  </td>
                  <td className="p-10 text-right font-black text-danger tabular-nums tracking-tighter text-xl opacity-60">
                    {s.invert ? `< ${s.min_warning}%` : `> ${s.max_warning}%`}
                  </td>
                  <td className="p-10 pl-14 text-[11px] font-black italic text-tx-muted uppercase opacity-20 tracking-tight leading-relaxed max-w-[240px]">{s.reference}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <footer className="p-12 border-t border-border-base flex flex-col md:flex-row justify-between items-center opacity-30 hover:opacity-100 transition-all group/footer">
         <p className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] max-w-3xl text-center md:text-left leading-loose group-hover/footer:text-tx-primary transition-colors">Compliance Stack: Ramsey Intelligence Protocol 70/30 · OCDE Home Finance Directive · CMF Standards Suite 2026 · AI Diagnostic Core</p>
         <div className="mt-10 md:mt-0 flex flex-col items-end gap-1">
            <p className="text-[11px] font-black text-tx-primary uppercase tracking-[0.4em] leading-none">Enterprise Platform v4.5</p>
            <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.2em] mt-1">Deepmind Agentic Coding Core</p>
         </div>
      </footer>
    </Card>
  );
};

export default AuditMatrixTable;
