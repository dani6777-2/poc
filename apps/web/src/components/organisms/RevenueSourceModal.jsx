import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import Input from '../atoms/Input';

/**
 * RevenueSourceModal
 * Handles the creation of new revenue sources/vectors.
 */
const RevenueSourceModal = ({ 
  newSource, 
  setNewSource, 
  year, 
  onClose, 
  onAdd 
}) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-primary/95 backdrop-blur-3xl" onClick={onClose} />
      <Card className="max-w-xl w-full p-12 md:p-16 relative z-10 animate-in zoom-in-95 duration-500 rounded-[4rem] border-none shadow-premium bg-secondary">
        <div className="flex items-center justify-between mb-16">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-tx-primary uppercase tracking-tighter leading-none">New Flow Vector</h2>
            <Badge variant="success" className="tracking-[0.5em] font-black uppercase text-[9px] px-3 py-1">FLOW_EXPANSION_CORE</Badge>
          </div>
          <Button variant="ghost" className="w-14 h-14 p-0 rounded-3xl text-tx-muted hover:text-tx-primary" onClick={onClose}>✕</Button>
        </div>
        
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-[0.4em] text-tx-muted ml-3">Channel Identifier / Source</label>
            <Input
              autoFocus
              className="text-2xl py-7 px-8 font-black tracking-tight"
              value={newSource}
              onChange={e => setNewSource(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAdd()}
              placeholder="e.g.: Dividend Yield, Portfolio A..."
            />
          </div>
          <p className="text-[12px] font-medium text-tx-muted/50 leading-relaxed italic border-l-4 border-accent/40 pl-6 py-2 uppercase tracking-tight">
            A new matrix record vector will be enabled for fiscal cycle {year}. The audit engine will integrate this source into global health algorithms.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 mt-16">
          <Button onClick={onAdd} variant="accent" className="flex-1 py-8 uppercase tracking-[0.4em] font-black shadow-glow-accent">
             Deploy Stream
          </Button>
          <Button onClick={onClose} variant="ghost" className="px-14 py-8 uppercase tracking-[0.3em] border border-border-base/60 font-black">
             Ignore
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RevenueSourceModal;
