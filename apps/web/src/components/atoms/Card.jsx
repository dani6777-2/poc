import React from 'react'

export default function Card({ children, className = '', interactive = false }) {
  return (
    <div className={`
      ${interactive ? 'interactive-card' : 'card-premium'}
      ${className}
    `}>
      {children}
    </div>
  )
}
