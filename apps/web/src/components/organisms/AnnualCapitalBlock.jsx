import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

const AnnualCapitalBlock = ({ 
  sections, 
  rowsGroupedBySection, 
  MONTH_LABELS, 
  MONTH_KEYS, 
  totalRevenuesMonth, 
  totalRevenuesAnnual, 
  totalPlannedMonth, 
  totalPlannedAnnual, 
  totalActualMonth, 
  totalActualAnnual, 
  netMonth, 
  accumulated, 
  collapsed, 
  toggleCollapse, 
  handleCellChange, 
  setConfirmId, 
  setForm, 
  setModal, 
  isAutoSync, 
  fmt, 
  totalPlannedRow 
}) => {
  return (
    <div className="space-y-10 page-entry">
      <Card className="overflow-hidden border-none shadow-premium">
        <div className="p-10 border-b border-border-base bg-tx-primary/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-5">
                <Badge variant="purple" glow className="px-5 py-1.5 font-black uppercase tracking-[0.3em] text-[9px]">Prospective Analysis</Badge>
                <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-tx-primary">Consolidated Annual Capital Matrix</h3>
            </div>
            <Badge variant="muted" className="opacity-40 tracking-widest font-black text-[9px]">IO_CORE_PLANNER</Badge>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-20">
              <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-tx-muted bg-secondary/95 backdrop-blur-xl border-b border-border-base/40">
                <th className="p-7 px-10 sticky left-0 z-30 bg-secondary shadow-2xl border-r border-border-base/40">Liquidity Vectors</th>
                {MONTH_LABELS.map(m => <th key={m} className="p-7 text-right bg-secondary/80">{m}</th>)}
                <th className="p-7 text-right text-tx-primary bg-tx-primary/[0.04]">Total Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40">
              <tr className="hover:bg-success/[0.02] transition-colors group">
                <td className="p-6 px-10 font-black text-[13px] text-success sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                    (+) Actual Revenues
                    <div className="text-[8px] opacity-30 mt-2 font-black">REVENUE_STREAM_V4</div>
                </td>
                {totalRevenuesMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-success/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                <td className="p-6 text-right font-black text-base text-success tabular-nums tracking-tighter bg-success/[0.02]">{fmt(totalRevenuesAnnual)}</td>
              </tr>
              <tr className="hover:bg-warning/[0.02] transition-colors group">
                <td className="p-6 px-10 font-black text-[13px] text-warning sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                    (-) Plan Budget
                    <div className="text-[8px] opacity-30 mt-2 font-black">BUDGET_CEILING_IO</div>
                </td>
                {totalPlannedMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-warning/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                <td className="p-6 text-right font-black text-base text-warning tabular-nums tracking-tighter bg-warning/[0.02]">{fmt(totalPlannedAnnual)}</td>
              </tr>
              <tr className="hover:bg-purple/[0.02] transition-colors group">
                <td className="p-6 px-10 font-black text-[13px] text-purple sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-widest leading-none">
                    (-) Actual Execution
                    <div className="text-[8px] opacity-30 mt-2 font-black">TRANSACTION_DETECTION</div>
                </td>
                {totalActualMonth.map((v, i) => <td key={i} className="p-6 text-right font-black text-sm text-purple/60 tabular-nums tracking-tighter">{v > 0 ? fmt(v) : '—'}</td>)}
                <td className="p-6 text-right font-black text-base text-purple tabular-nums tracking-tighter bg-purple/[0.02]">{fmt(totalActualAnnual)}</td>
              </tr>
              <tr className="bg-tx-primary/[0.06] border-t-2 border-border-base relative">
                <td className="p-8 px-10 font-black text-[15px] text-tx-primary sticky left-0 z-20 bg-secondary border-r border-border-base/40 uppercase tracking-[0.2em] shadow-2xl">Net Surplus</td>
                {netMonth.map((v, i) => <td key={i} className={`p-8 text-right font-black text-base tabular-nums tracking-tighter ${v >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(v)}</td>)}
                <td className={`p-8 text-right font-black text-xl tabular-nums tracking-tighter ${(totalRevenuesAnnual - totalActualAnnual) >= 0 ? 'text-success drop-shadow-glow-success' : 'text-danger drop-shadow-glow-danger'}`}>{fmt(totalRevenuesAnnual - totalActualAnnual)}</td>
              </tr>
              <tr className="bg-accent/[0.08] shadow-inner">
                <td className="p-8 px-10 font-black text-[15px] text-accent-light sticky left-0 z-20 bg-secondary/90 border-r border-border-base/40 uppercase tracking-[0.2em]">Accumulated Cash</td>
                {accumulated.map((v, i) => <td key={i} className={`p-8 text-right font-black text-base tabular-nums tracking-tighter ${v >= 0 ? 'text-accent-light' : 'text-danger-light'}`}>{fmt(v)}</td>)}
                <td className="bg-secondary/90" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {sections.map(sec => {
        const secRows = rowsGroupedBySection[sec.id] || [];
        const secTotals = MONTH_KEYS.map(m => secRows.reduce((s, r) => s + (parseFloat(r[m]) || 0), 0));
        const secTotal = secTotals.reduce((a, b) => a + b, 0);
        const color = sec.color_accent || '#6366f1';
        return (
          <Card key={sec.id} border={false} className="overflow-hidden border-none shadow-premium relative" style={{ borderLeft: `6px solid ${color}` }}>
            <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-tx-primary/[0.02] transition-colors" onClick={() => toggleCollapse(sec.id)}>
              <div className="flex items-center gap-5">
                <span className="text-3xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all duration-700">{sec.icon || '📂'}</span>
                <h4 className="text-[14px] font-black text-tx-primary uppercase tracking-[0.3em]">{sec.name}</h4>
              </div>
              <div className="flex gap-12 items-center">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[9px] font-black text-tx-muted uppercase tracking-[0.3em] opacity-40">ANNUALIZED TOTAL</span>
                  <div className="flex items-center gap-4">
                    <strong className="text-xl font-black text-tx-primary tracking-tighter transition-all">{fmt(secTotal)}</strong>
                    {totalRevenuesAnnual > 0 && <Badge variant="muted" className="font-black uppercase text-[10px] tracking-widest">{Math.round(secTotal / totalRevenuesAnnual * 100)}% REV</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="px-5 h-10 border border-border-base/40 uppercase font-black text-[9px] tracking-widest opacity-40 hover:opacity-100" onClick={e => { e.stopPropagation(); setForm({ section_id: sec.id, description: '' }); setModal(true) }}>+ Registry</Button>
                <span className="text-tx-muted opacity-20 px-4 transition-transform duration-500" style={{ transform: collapsed[sec.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </div>
            </div>

            {!collapsed[sec.id] && (
              <div className="overflow-x-auto custom-scrollbar border-t border-border-base/40">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-tx-muted/40 tracking-[0.3em] bg-tx-primary/[0.02] border-b border-border-base/40">
                      <th className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-xl border-r border-border-base/40">Expense Line</th>
                      {MONTH_LABELS.map(m => <th key={m} className="p-6 text-right tabular-nums">{m}</th>)}
                      <th className="p-6 text-right text-tx-primary bg-tx-primary/[0.04]">Balance</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/40">
                    {secRows.map(row => {
                      const auto = isAutoSync(row.description, row.is_automatic);
                      return (
                        <tr key={row.id} className={`hover:bg-tx-primary/[0.02] transition-colors group h-16 ${auto ? 'bg-accent/[0.02]' : ''}`}>
                          <td className="p-3 px-10 text-[13px] font-black text-tx-primary sticky left-0 z-20 bg-secondary border-r border-border-base/40 shadow-2xl flex items-center gap-3">
                            <span className="uppercase tracking-widest group-hover:text-accent transition-colors truncate">{row.description}</span>
                            {auto && <Badge variant="info" className="scale-[0.6] origin-left font-black">AUTO</Badge>}
                          </td>
                          {MONTH_KEYS.map(m => (
                            <td key={m} className="p-1.5 px-3">
                              {auto ? <span className="block text-right text-[11px] font-bold text-tx-primary/30 py-3 tabular-nums tracking-tighter">{(parseFloat(row[m]) || 0) > 0 ? fmt(parseFloat(row[m])) : '—'}</span> : (
                                  <input type="number" value={row[m] || ''} onChange={e => handleCellChange(row.id, m, e.target.value)}
                                  className="w-full h-10 bg-tx-primary/[0.01] hover:bg-tx-primary/[0.05] focus:bg-accent/5 focus:ring-1 focus:ring-accent/20 rounded-xl px-3 text-right text-[11px] font-bold text-tx-primary outline-none transition-all [appearance:textfield] tracking-tighter" placeholder="0" />
                              )}
                            </td>
                          ))}
                          <td className="p-4 text-right font-black text-[13px] text-tx-primary bg-tx-primary/[0.04] tabular-nums tracking-tighter">{fmt(totalPlannedRow(row))}</td>
                          <td className="p-4 text-right">
                            {!auto && (
                                <Button 
                                    variant="ghost" 
                                    className="p-2 rounded-lg hover:bg-danger/10 text-tx-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all" 
                                    onClick={() => setConfirmId(row.id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-9 5h6m-6 4h6"/></svg>
                                </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-border-base/40 bg-tx-primary/[0.06] text-[11px] font-black uppercase text-tx-secondary tracking-[0.2em] relative">
                    <tr className="h-20">
                      <td className="p-6 px-10 sticky left-0 z-20 bg-secondary shadow-2xl border-r border-border-base/40">Aggregate Sum {sec.name}</td>
                      {secTotals.map((t, i) => <td key={i} className="p-6 text-right tabular-nums tracking-tighter">{fmt(t)}</td>)}
                      <td className="p-6 text-right text-tx-primary tabular-nums tracking-tighter text-lg">{fmt(secTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AnnualCapitalBlock;
