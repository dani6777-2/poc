import React from 'react'

export default function Card({ children, className = '', interactive = false }) {
  return (
    <div className={`
      w-full min-w-0 max-w-full
      ${interactive ? 'interactive-card' : 'card-premium'}
      ${className}
    `}>
      {children}
    </div>
  )
}
