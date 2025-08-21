import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-1 text-sm text-destructive mt-1 ${className}`}>
      <AlertCircle className="h-3 w-3" />
      <span>{error}</span>
    </div>
  );
};