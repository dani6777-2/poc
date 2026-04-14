import React from 'react';

export default function Label({ children, htmlFor, className = '', required = false, ...props }) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-xs font-black text-tx-secondary uppercase tracking-widest mb-2 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}
