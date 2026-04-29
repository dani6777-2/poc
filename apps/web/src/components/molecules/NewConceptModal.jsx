import React, { useState } from 'react';
import { Card, Button } from '../atoms';

/**
 * NewConceptModal Component (v5.0)
 * Facilitates the creation of manual budget vectors.
 */
export default function NewConceptModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  year, 
  sectionId, 
  categoryId 
}) {
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!description.trim()) return;
    onConfirm({
      year,
      section_id: sectionId,
      category_id: categoryId,
      description: description.trim()
    });
    setDescription('');
  };

  return (
    <div 
      className="fixed inset-0 bg-primary/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[3000] animate-in zoom-in-95 duration-300"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <Card className="max-w-md w-full p-10 rounded-[2.5rem] border-none shadow-2xl bg-secondary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent/20" />
        
        <div className="mb-10 text-center">
          <h3 className="text-2xl font-black text-tx-primary uppercase tracking-tighter mb-2">
            New <span className="text-accent italic font-light">Financial Vector</span>
          </h3>
          <p className="text-[10px] font-bold text-tx-muted uppercase tracking-[0.3em] opacity-40">
            Initializing manual budget constraint for {year}
          </p>
        </div>

        <div className="space-y-8">
          <div className="group">
            <label className="text-[9px] font-black text-tx-muted uppercase tracking-[0.4em] mb-3 block group-focus-within:text-accent transition-colors">
              Concept Description / Tag
            </label>
            <input
              className="w-full bg-tx-primary/[0.03] border-none rounded-2xl p-5 text-sm font-bold text-tx-primary focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-tx-muted/20"
              placeholder="e.g. Structural Maintenance, External Services..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 py-5 uppercase font-black tracking-widest text-[10px] h-14" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              variant="accent" 
              className="flex-1 py-5 uppercase font-black tracking-widest text-[10px] h-14 shadow-glow-accent disabled:opacity-30 disabled:grayscale transition-all" 
              onClick={handleConfirm}
              disabled={!description.trim()}
            >
              Deploy Vector
            </Button>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border-base/40 flex justify-between items-center opacity-30">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest">Section Target</span>
            <span className="text-[10px] font-bold">Cost Center {sectionId}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-black uppercase tracking-widest">Category Link</span>
            <span className="text-[10px] font-bold">Node {categoryId || 'Root'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
