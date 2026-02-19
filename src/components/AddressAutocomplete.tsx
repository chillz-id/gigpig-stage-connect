
import React, { useRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  showSetupCard?: boolean;
}

export const AddressAutocomplete = React.forwardRef<HTMLInputElement, AddressAutocompleteProps>(({
  onAddressSelect,
  placeholder = "Enter address...",
  defaultValue = "",
  className = "",
}, forwardedRef) => {
  const internalRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(forwardedRef, () => internalRef.current!);

  return (
    <Input
      ref={internalRef}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={className}
      onChange={(e) => {
        const value = e.target.value.trim();
        if (value) {
          onAddressSelect(value);
        }
      }}
    />
  );
});

AddressAutocomplete.displayName = 'AddressAutocomplete';
