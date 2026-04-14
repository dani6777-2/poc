import React from 'react'

export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-tx-muted ml-1">
          {label}
        </label>
      )}
      <input 
        className={`
          w-full bg-tx-primary/[0.03] border-border-base rounded-2xl p-4 text-tx-primary text-sm font-bold transition-all outline-none
          focus:bg-tx-primary/5 focus:ring-2 focus:ring-accent/50 focus:border-accent/40
          placeholder:text-tx-muted/40
          ${error ? 'border-danger/50 ring-2 ring-danger/10' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-[10px] font-bold text-danger ml-1">{error}</span>}
    </div>
  )
}
