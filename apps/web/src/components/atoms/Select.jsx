import React from 'react'

export default function Select({ label, options = [], className = '', ...props }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-tx-muted ml-1">
          {label}
        </label>
      )}
      <select 
        className={`
          w-full bg-tx-primary/[0.03] border-border-base rounded-2xl p-4 text-tx-primary text-sm font-bold transition-all outline-none
          focus:bg-tx-primary/5 focus:ring-2 focus:ring-accent/50 focus:border-accent/40
          appearance-none cursor-pointer
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(148, 163, 184, 0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1.25rem center',
          backgroundSize: '1em'
        }}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt} className="bg-secondary">
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  )
}
