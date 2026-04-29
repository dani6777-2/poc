import React from 'react';
import { Card, Button } from '../atoms';

export default function ConfirmModal({ mensaje, onConfirm, onCancel, type = 'danger' }) {
  const isDanger = type === 'danger';
  
  return (
    <div 
      className="fixed inset-0 bg-primary/90 backdrop-blur-xl flex items-center justify-center p-6 z-[3000] animate-in fade-in duration-300" 
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <Card className="max-w-md w-full p-8 rounded-[2.5rem] border-none shadow-2xl bg-secondary relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isDanger ? 'bg-danger/20' : 'bg-warning/20'}`} />
        
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-6 ${isDanger ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
            {isDanger ? '🗑️' : '⚠️'}
          </div>
          
          <h3 className="text-xl font-black text-tx-primary uppercase tracking-tighter mb-3">
            {isDanger ? 'Destructive Action' : 'Attention Required'}
          </h3>
          
          <p className="text-sm font-medium text-tx-secondary leading-relaxed mb-10 opacity-70">
            {mensaje}
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            className="flex-1 py-4 uppercase font-black tracking-widest text-[10px] h-14" 
            onClick={onCancel}
          >
            Go Back
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'warning'} 
            className={`flex-1 py-4 uppercase font-black tracking-widest text-[10px] h-14 shadow-lg ${isDanger ? 'shadow-danger/20' : 'shadow-warning/20'}`} 
            onClick={onConfirm} 
            autoFocus
          >
            {isDanger ? 'Confirm Deletion' : 'Proceed'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
