import React from 'react'

export default function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div {...props} className={`
      w-full min-w-0 max-w-full
      ${interactive ? 'interactive-card' : 'card-premium'}
      ${className}
    `}>
      {children}
    </div>
  )
}
