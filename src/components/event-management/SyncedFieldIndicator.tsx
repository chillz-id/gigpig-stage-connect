import React from 'react';
import { Lock, Cloud, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * SyncedFieldIndicator
 *
 * Visual indicator for fields that are synced from external sources
 * and cannot be edited directly.
 */

interface SyncedFieldIndicatorProps {
  /**
   * The source of the synced data
   */
  source: 'humanitix' | 'eventbrite' | string;

  /**
   * Optional custom message
   */
  message?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md';

  /**
   * Additional className
   */
  className?: string;
}

export function SyncedFieldIndicator({
  source,
  message,
  size = 'sm',
  className,
}: SyncedFieldIndicatorProps) {
  const sourceLabel = source === 'humanitix'
    ? 'Humanitix'
    : source === 'eventbrite'
      ? 'Eventbrite'
      : source;

  const defaultMessage = `This field is synced from ${sourceLabel} and cannot be edited directly.`;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-muted-foreground cursor-help',
              className
            )}
          >
            <Lock className={iconSize} />
            <Cloud className={iconSize} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm max-w-xs">{message ?? defaultMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * SyncedFieldWrapper
 *
 * Wraps a form field to show synced status and disable editing
 */

interface SyncedFieldWrapperProps {
  /**
   * Whether the field is synced
   */
  isSynced: boolean;

  /**
   * The source of synced data
   */
  source?: 'humanitix' | 'eventbrite' | string | null;

  /**
   * Whether to allow override (for platform-editable fields)
   */
  allowOverride?: boolean;

  /**
   * Label for the field
   */
  label?: string;

  /**
   * The form field content
   */
  children: React.ReactNode;

  /**
   * Additional className for the wrapper
   */
  className?: string;
}

export function SyncedFieldWrapper({
  isSynced,
  source,
  allowOverride = false,
  label,
  children,
  className,
}: SyncedFieldWrapperProps) {
  const showIndicator = isSynced && source && !allowOverride;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {showIndicator && (
            <SyncedFieldIndicator source={source} size="sm" />
          )}
        </div>
      )}
      <div className={cn(showIndicator && 'opacity-60 pointer-events-none')}>
        {children}
      </div>
      {isSynced && !allowOverride && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Synced from {source}
        </p>
      )}
    </div>
  );
}

/**
 * ReadOnlySyncedValue
 *
 * Display-only component for synced values that cannot be edited
 */

interface ReadOnlySyncedValueProps {
  /**
   * The value to display
   */
  value: React.ReactNode;

  /**
   * The source of synced data
   */
  source: 'humanitix' | 'eventbrite' | string;

  /**
   * Label for the field
   */
  label?: string;

  /**
   * Format type for special formatting
   */
  format?: 'currency' | 'number' | 'date' | 'text';

  /**
   * Additional className
   */
  className?: string;
}

export function ReadOnlySyncedValue({
  value,
  source,
  label,
  format = 'text',
  className,
}: ReadOnlySyncedValueProps) {
  const formatValue = () => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
        }).format(Number(value));

      case 'number':
        return new Intl.NumberFormat('en-AU').format(Number(value));

      case 'date':
        try {
          return new Date(String(value)).toLocaleDateString('en-AU', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } catch {
          return String(value);
        }

      default:
        return String(value);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <SyncedFieldIndicator source={source} size="sm" />
        </div>
      )}
      <div className="text-base font-medium bg-muted/50 rounded-md px-3 py-2 border border-muted">
        {formatValue()}
      </div>
    </div>
  );
}

/**
 * SyncedFieldsSection
 *
 * Section header for a group of synced fields
 */

interface SyncedFieldsSectionProps {
  /**
   * The source of synced data
   */
  source: 'humanitix' | 'eventbrite' | string;

  /**
   * Section title
   */
  title?: string;

  /**
   * Section description
   */
  description?: string;

  /**
   * Child content
   */
  children: React.ReactNode;

  /**
   * Additional className
   */
  className?: string;
}

export function SyncedFieldsSection({
  source,
  title = 'Synced Data',
  description,
  children,
  className,
}: SyncedFieldsSectionProps) {
  const sourceLabel = source === 'humanitix'
    ? 'Humanitix'
    : source === 'eventbrite'
      ? 'Eventbrite'
      : source;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {description ?? `This data is synced from ${sourceLabel} and updated automatically.`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          <Cloud className="h-3.5 w-3.5" />
          <span>{sourceLabel}</span>
        </div>
      </div>
      <div className="pl-6 border-l-2 border-muted space-y-3">
        {children}
      </div>
    </div>
  );
}
