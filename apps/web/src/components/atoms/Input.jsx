import React from 'react';
import FormField from '../molecules/FormField';

export default function Input({ label, error, className = '', ...props }) {
  const inputElement = (
    <input 
      className={`
        w-full bg-tx-primary/[0.03] border border-border-base rounded-2xl p-4 text-tx-primary text-sm font-bold transition-all outline-none
        focus:bg-tx-primary/5 focus:ring-2 focus:ring-accent/50 focus:border-accent/40
        placeholder:text-tx-muted/40
        ${error ? 'border-danger/50 ring-2 ring-danger/10' : ''}
        ${className}
      `}
      {...props}
    />
  );

  if (!label && !error) return inputElement;

  return (
    <FormField label={label} error={error} className="w-full">
      {inputElement}
    </FormField>
  );
}
