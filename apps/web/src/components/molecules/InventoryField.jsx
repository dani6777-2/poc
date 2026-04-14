import React from 'react';

const InventoryField = ({ label, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-black text-tx-muted uppercase tracking-[0.3em] ml-2">
      {label}
    </label>
    {children}
  </div>
);

export default InventoryField;
