import React from 'react';
import FormField from '../molecules/FormField';

export default function Select({ label, error, options = [], className = '', ...props }) {
  const selectElement = (
    <select 
      className={`
        w-full bg-tx-primary/[0.03] border border-border-base rounded-2xl p-4 text-tx-primary text-sm font-bold transition-all outline-none
        focus:bg-tx-primary/5 focus:ring-2 focus:ring-accent/50 focus:border-accent/40
        appearance-none cursor-pointer bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em]
        ${className}
      `}
      {...props}
    >
      {options.map((opt, i) => {
        const val = opt.value ?? opt.id ?? opt;
        const lbl = opt.label ?? opt.name ?? (typeof opt === 'object' ? `Option ${i}` : opt);
        
        return (
          <option key={`${val}-${i}`} value={val} className="bg-secondary">
            {lbl}
          </option>
        );
      })}
    </select>
  );

  if (!label && !error) return selectElement;

  return (
    <FormField label={label} error={error} className="w-full">
      {selectElement}
    </FormField>
  );
}
