/**
 * ABNWithGstInput - ABN input with auto GST lookup
 *
 * Features:
 * - ABN formatting (XX XXX XXX XXX)
 * - Auto-lookup via ABR on valid ABN
 * - Auto-tick GST checkbox if entity is GST registered
 * - Manual override always allowed
 * - Shows entity name and status from lookup
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  formatABN,
  cleanABN,
  isValidABNFormat,
  validateABNChecksum,
  lookupABN,
} from '@/utils/abn';

interface ABNLookupResult {
  abn: string;
  isActive: boolean;
  entityName: string | null;
  entityType: string | null;
  gstRegistered: boolean;
  gstEffectiveDate: string | null;
  address: string | null;
  stateCode: string | null;
  postcode: string | null;
}

interface ABNWithGstInputProps {
  value: string;
  onChange: (abn: string) => void;
  gstRegistered: boolean;
  onGstChange: (gstRegistered: boolean) => void;
  onLookupComplete?: (result: ABNLookupResult | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

type LookupStatus = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

export function ABNWithGstInput({
  value,
  onChange,
  gstRegistered,
  onGstChange,
  onLookupComplete,
  label = 'ABN',
  disabled = false,
  className,
}: ABNWithGstInputProps) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupResult, setLookupResult] = useState<ABNLookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookedUpABN = useRef<string>('');

  // Handle ABN input change with formatting
  const handleABNChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Only allow digits and spaces
    const cleaned = rawValue.replace(/[^\d\s]/g, '');
    // Remove all spaces first, then format
    const digitsOnly = cleaned.replace(/\s/g, '');

    if (digitsOnly.length <= 11) {
      const formatted = formatABN(digitsOnly);
      onChange(formatted);
    }
  }, [onChange]);

  // Perform ABN lookup when value changes
  useEffect(() => {
    const cleanedABN = cleanABN(value);

    // Clear timeout on value change
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    // Reset state if ABN is empty or too short
    if (cleanedABN.length < 11) {
      setLookupStatus('idle');
      setLookupResult(null);
      setErrorMessage(null);
      return;
    }

    // Check format
    if (!isValidABNFormat(cleanedABN)) {
      setLookupStatus('invalid');
      setErrorMessage('ABN must be 11 digits');
      return;
    }

    // Check checksum
    if (!validateABNChecksum(cleanedABN)) {
      setLookupStatus('invalid');
      setErrorMessage('Invalid ABN checksum');
      return;
    }

    // Skip if we already looked up this ABN
    if (lastLookedUpABN.current === cleanedABN) {
      return;
    }

    // Debounce the lookup
    lookupTimeoutRef.current = setTimeout(async () => {
      setLookupStatus('loading');
      setErrorMessage(null);

      try {
        const result = await lookupABN(cleanedABN);

        if (result) {
          lastLookedUpABN.current = cleanedABN;
          setLookupResult(result);
          setLookupStatus('success');
          setErrorMessage(null);

          // Auto-tick GST if registered (but don't un-tick if user already checked it)
          if (result.gstRegistered && !gstRegistered) {
            onGstChange(true);
          }

          // Notify parent
          onLookupComplete?.(result);
        } else {
          setLookupStatus('error');
          setErrorMessage('ABN not found in ABR');
          setLookupResult(null);
          onLookupComplete?.(null);
        }
      } catch (error) {
        setLookupStatus('error');
        setErrorMessage('Failed to lookup ABN');
        setLookupResult(null);
        onLookupComplete?.(null);
      }
    }, 500); // 500ms debounce

    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
      }
    };
  }, [value, gstRegistered, onGstChange, onLookupComplete]);

  // Status icon for the input
  const renderStatusIcon = () => {
    switch (lookupStatus) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'success':
        return lookupResult?.isActive ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        );
      case 'error':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* ABN Input */}
      <div className="space-y-2">
        <Label htmlFor="abn">{label}</Label>
        <div className="relative">
          <Input
            id="abn"
            value={value}
            onChange={handleABNChange}
            placeholder="XX XXX XXX XXX"
            maxLength={14}
            disabled={disabled}
            className={cn(
              'pr-10',
              lookupStatus === 'invalid' || lookupStatus === 'error'
                ? 'border-destructive focus-visible:ring-destructive'
                : lookupStatus === 'success'
                  ? 'border-green-500 focus-visible:ring-green-500'
                  : ''
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderStatusIcon()}
          </div>
        </div>
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      {/* Entity Info from Lookup */}
      {lookupResult && (
        <div className="rounded-md bg-muted p-3 text-sm space-y-1">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{lookupResult.entityName || 'Unknown Entity'}</p>
              {lookupResult.entityType && (
                <p className="text-muted-foreground text-xs">{lookupResult.entityType}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
            <span className={cn(
              'flex items-center gap-1',
              lookupResult.isActive ? 'text-green-600' : 'text-amber-600'
            )}>
              {lookupResult.isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Not Active
                </>
              )}
            </span>
            <span className={cn(
              'flex items-center gap-1',
              lookupResult.gstRegistered ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {lookupResult.gstRegistered ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  GST Registered
                </>
              ) : (
                'Not GST Registered'
              )}
            </span>
          </div>
        </div>
      )}

      {/* GST Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="gstRegistered"
          checked={gstRegistered}
          onCheckedChange={(checked) => onGstChange(checked === true)}
          disabled={disabled}
        />
        <Label
          htmlFor="gstRegistered"
          className={cn(
            'font-normal cursor-pointer',
            lookupResult?.gstRegistered && 'text-green-600'
          )}
        >
          GST Registered
          {lookupResult?.gstRegistered && (
            <span className="text-xs text-muted-foreground ml-1">(verified)</span>
          )}
        </Label>
      </div>
    </div>
  );
}

export default ABNWithGstInput;
