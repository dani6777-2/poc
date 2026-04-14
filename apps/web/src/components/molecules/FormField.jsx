import React from 'react';
import { Label, Text } from '../atoms';

export default function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '' 
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <Label required={required} className="mb-0">
          {label}
        </Label>
      )}
      {children}
      {error && (
        <Text variant="caption" className="text-danger mt-1">
          {error}
        </Text>
      )}
    </div>
  );
}