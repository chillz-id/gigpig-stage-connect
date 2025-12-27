/**
 * MobileSelect Component
 *
 * Mobile-optimized select/dropdown with:
 * - Native HTML5 select on mobile (best UX, bottom sheet on iOS/Android)
 * - Radix UI Select on desktop (searchable, styled)
 * - 44px touch targets
 * - Multi-select support
 * - Search/filter for large option lists
 * - Clear error states
 */

import React, { useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

export interface SelectOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Optional disabled state */
  disabled?: boolean;
}

interface MobileSelectProps {
  /** Selected value(s) */
  value: string | string[];
  /** Callback when selection changes */
  onChange: (value: string | string[]) => void;
  /** Available options */
  options: SelectOption[];
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Enable search/filter (desktop only) */
  searchable?: boolean;
  /** Search placeholder (desktop only) */
  searchPlaceholder?: string;
  /** Empty state message (desktop only) */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export function MobileSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option',
  error,
  disabled = false,
  required = false,
  multiple = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  className
}: MobileSelectProps) {
  const { isMobile } = useMobileLayout();
  const [open, setOpen] = React.useState(false);

  // Normalize value to array for easier handling
  const valueArray = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);

  // Get display text for selected values
  const displayText = useMemo(() => {
    if (valueArray.length === 0) return placeholder;

    const selectedOptions = options.filter(opt => valueArray.includes(opt.value));
    if (selectedOptions.length === 0) return placeholder;

    if (multiple) {
      return `${selectedOptions.length} selected`;
    }

    return selectedOptions[0]?.label || placeholder;
  }, [valueArray, options, placeholder, multiple]);

  // Handle selection
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValue = valueArray.includes(optionValue)
        ? valueArray.filter(v => v !== optionValue)
        : [...valueArray, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  // Handle native select change
  const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
      onChange(selectedOptions);
    } else {
      onChange(e.target.value);
    }
  };

  // Mobile: Use native HTML5 select
  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <select
          value={multiple ? undefined : (valueArray[0] || '')}
          onChange={handleNativeChange}
          disabled={disabled}
          required={required}
          multiple={multiple}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "touch-target-44",
            error && "border-red-500 focus-visible:ring-red-500",
            multiple && "h-auto min-h-[88px]"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'select-error' : undefined}
        >
          {!multiple && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              selected={multiple ? valueArray.includes(option.value) : undefined}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id="select-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Desktop: Use Radix UI Select with optional search
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              valueArray.length === 0 && "text-muted-foreground",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? 'select-error' : undefined}
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {searchable && <CommandInput placeholder={searchPlaceholder} />}
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      valueArray.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p id="select-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default MobileSelect;
