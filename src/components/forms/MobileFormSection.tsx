/**
 * MobileFormSection Component
 *
 * Reusable form section wrapper optimized for mobile with:
 * - Collapsible sections to reduce scroll
 * - Clear visual hierarchy
 * - Touch-friendly expand/collapse
 * - Proper spacing for mobile viewports
 * - Optional help text and validation state
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

interface MobileFormSectionProps {
  /** Section title */
  title: string;
  /** Optional description or help text */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Allow section to be collapsible (default: true on mobile, false on desktop) */
  collapsible?: boolean;
  /** Initial collapsed state (default: false) */
  defaultCollapsed?: boolean;
  /** Show validation state icon */
  validationState?: 'valid' | 'invalid' | 'none';
  /** Error message to display */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Required field indicator */
  required?: boolean;
}

export function MobileFormSection({
  title,
  description,
  children,
  collapsible,
  defaultCollapsed = false,
  validationState = 'none',
  error,
  className,
  required = false
}: MobileFormSectionProps) {
  const { isMobile } = useMobileLayout();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Auto-enable collapsible on mobile unless explicitly disabled
  const isCollapsible = collapsible ?? isMobile;

  const toggleCollapse = () => {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <Card className={cn(
      "mb-4",
      isMobile && "rounded-lg",
      className
    )}>
      <CardHeader
        className={cn(
          "cursor-pointer select-none",
          isMobile ? "p-4 pb-3" : "p-6",
          isCollapsible && "hover:bg-accent/50 transition-colors"
        )}
        onClick={toggleCollapse}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className={cn(
              "font-semibold flex items-center gap-2",
              isMobile ? "text-base" : "text-lg"
            )}>
              <span className="truncate">{title}</span>
              {required && (
                <span className="text-red-500 text-sm" aria-label="Required">
                  *
                </span>
              )}
              {validationState === 'valid' && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" aria-label="Valid" />
              )}
              {validationState === 'invalid' && (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" aria-label="Invalid" />
              )}
            </CardTitle>
            {description && (
              <CardDescription className={cn(
                "mt-1.5",
                isMobile ? "text-sm" : "text-sm"
              )}>
                {description}
              </CardDescription>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-1.5 flex items-start gap-1.5">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {isCollapsible && (
            <button
              type="button"
              className={cn(
                "flex-shrink-0 p-1 rounded-md hover:bg-accent transition-colors",
                isMobile && "touch-target-44 -m-2"
              )}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronDown className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
              ) : (
                <ChevronUp className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
              )}
            </button>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className={cn(
          isMobile ? "p-4 pt-0 space-y-4" : "p-6 pt-0 space-y-6"
        )}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export default MobileFormSection;
