import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationFeedbackProps {
  errors?: string[];
  warnings?: string[];
  success?: string;
  info?: string;
  className?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  errors = [],
  warnings = [],
  success,
  info,
  className
}) => {
  if (!errors.length && !warnings.length && !success && !info) {
    return null;
  }

  return (
    <div className={cn("space-y-2 text-sm", className)}>
      {/* Errors */}
      {errors.map((error, index) => (
        <div
          key={`error-${index}`}
          className="flex items-start gap-2 text-red-600 dark:text-red-400"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ))}

      {/* Warnings */}
      {warnings.map((warning, index) => (
        <div
          key={`warning-${index}`}
          className="flex items-start gap-2 text-amber-600 dark:text-amber-400"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      ))}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Info */}
      {info && (
        <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{info}</span>
        </div>
      )}
    </div>
  );
};

// Field-level validation indicator
interface FieldValidationProps {
  hasError?: boolean;
  hasWarning?: boolean;
  isRequired?: boolean;
  isValid?: boolean;
}

export const FieldValidationIndicator: React.FC<FieldValidationProps> = ({
  hasError,
  hasWarning,
  isRequired,
  isValid
}) => {
  if (hasError) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  
  if (hasWarning) {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
  
  if (isValid) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  
  if (isRequired) {
    return <span className="text-red-500">*</span>;
  }
  
  return null;
};

// Validation summary component
interface ValidationSummaryProps {
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  onFixError?: (field: string) => void;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  warnings,
  onFixError
}) => {
  const errorCount = Object.values(errors).flat().length;
  const warningCount = Object.values(warnings).flat().length;

  if (errorCount === 0 && warningCount === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            All validations passed! Your event is ready to publish.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {errorCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {errorCount} {errorCount === 1 ? 'Error' : 'Errors'} to fix
          </h4>
          <ul className="space-y-1">
            {Object.entries(errors).map(([field, fieldErrors]) =>
              fieldErrors.map((error, index) => (
                <li
                  key={`${field}-error-${index}`}
                  className="text-sm text-red-700 dark:text-red-300 flex items-center justify-between"
                >
                  <span>• {error}</span>
                  {onFixError && (
                    <button
                      type="button"
                      onClick={() => onFixError(field)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 underline text-xs ml-2"
                    >
                      Fix
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warningCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'} to review
          </h4>
          <ul className="space-y-1">
            {Object.entries(warnings).map(([field, fieldWarnings]) =>
              fieldWarnings.map((warning, index) => (
                <li
                  key={`${field}-warning-${index}`}
                  className="text-sm text-amber-700 dark:text-amber-300"
                >
                  • {warning}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};