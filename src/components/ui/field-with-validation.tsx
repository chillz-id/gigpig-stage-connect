import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { FieldValidationIndicator } from '@/components/events/ValidationFeedback';

interface FieldWithValidationProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
  isValid?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const FieldWithValidation: React.FC<FieldWithValidationProps> = ({
  label,
  htmlFor,
  required = false,
  hasError = false,
  hasWarning = false,
  isValid = false,
  description,
  className,
  children
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          {label}
          <FieldValidationIndicator
            hasError={hasError}
            hasWarning={hasWarning}
            isRequired={required}
            isValid={isValid}
          />
        </span>
        {description && (
          <span className="text-xs font-normal text-muted-foreground">
            {description}
          </span>
        )}
      </Label>
      {children}
    </div>
  );
};

// Enhanced Input with built-in validation styling
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  hasWarning?: boolean;
  isValid?: boolean;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, hasError, hasWarning, isValid, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-red-500 focus-visible:ring-red-500",
            hasWarning && !hasError && "border-amber-500 focus-visible:ring-amber-500",
            isValid && !hasError && !hasWarning && "border-green-500 focus-visible:ring-green-500",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <FieldValidationIndicator
            hasError={hasError}
            hasWarning={hasWarning}
            isValid={isValid && !hasError && !hasWarning}
          />
        </div>
      </div>
    );
  }
);
ValidatedInput.displayName = "ValidatedInput";

// Enhanced Textarea with built-in validation styling
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  hasWarning?: boolean;
  isValid?: boolean;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ className, hasError, hasWarning, isValid, ...props }, ref) => {
    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-red-500 focus-visible:ring-red-500",
            hasWarning && !hasError && "border-amber-500 focus-visible:ring-amber-500",
            isValid && !hasError && !hasWarning && "border-green-500 focus-visible:ring-green-500",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute right-2 top-2">
          <FieldValidationIndicator
            hasError={hasError}
            hasWarning={hasWarning}
            isValid={isValid && !hasError && !hasWarning}
          />
        </div>
      </div>
    );
  }
);
ValidatedTextarea.displayName = "ValidatedTextarea";