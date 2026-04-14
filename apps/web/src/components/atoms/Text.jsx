import React from 'react';

export default function Text({ as: Component = 'p', variant = 'body', className = '', children, ...props }) {
  const variants = {
    h1: 'text-2xl md:text-3xl font-black text-tx-primary tracking-tight',
    h2: 'text-xl md:text-2xl font-bold text-tx-primary tracking-tight',
    h3: 'text-lg md:text-xl font-bold text-tx-primary',
    h4: 'text-base font-bold text-tx-secondary uppercase tracking-widest',
    body: 'text-sm text-tx-secondary',
    bodySmall: 'text-xs text-tx-muted',
    caption: 'text-[10px] text-tx-muted uppercase tracking-widest',
  };

  return (
    <Component className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
