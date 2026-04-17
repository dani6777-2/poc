import React from 'react'

export default function Badge({ children, className = '', variant = 'info', glow = false, size = 'md', ...props }) {
  const variants = {
    info: 'bg-info/10 text-info border-info/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    purple: 'bg-purple/10 text-purple border-purple/20',
    muted: 'bg-tx-primary/5 text-tx-muted border-border-base'
  }
  
  const glowStyle = glow ? `shadow-glow-${variant}` : ''

  return (
    <span 
      {...props}
      className={`
      inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border leading-none
      ${variants[variant]} ${glowStyle} ${className}
    `}>
      {children}
    </span>
  )
}
