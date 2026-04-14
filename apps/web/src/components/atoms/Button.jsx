import React from 'react'

export default function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-light',
    secondary: 'bg-tx-primary/5 text-tx-secondary hover:bg-tx-primary/10 hover:text-tx-primary',
    outline: 'border border-border-base text-tx-secondary hover:bg-tx-primary/5 hover:text-tx-primary',
    danger: 'bg-danger text-white shadow-lg shadow-danger/20 hover:opacity-90',
    ghost: 'text-tx-muted hover:text-tx-primary transition-colors'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm'
  }

  return (
    <button 
      className={`
        rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
