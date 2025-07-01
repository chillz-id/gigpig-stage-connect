
import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  showSetupCard?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = "Enter address...",
  defaultValue = "",
  className = "",
  showSetupCard = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const { isLoaded, loadScript } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded && !isInitializing) {
      setIsInitializing(true);
      loadScript()
        .then(() => {
          initializeAutocomplete();
        })
        .catch((error) => {
          console.error('Failed to load Google Places:', error);
          // Show a more user-friendly message for Google Maps issues
          toast({
            title: "Maps service unavailable",
            description: "Address autocomplete is currently unavailable. You can still enter addresses manually.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else if (isLoaded) {
      initializeAutocomplete();
    }
  }, [isLoaded]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'au' },
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (!place.formatted_address) {
          toast({
            title: "Invalid address",
            description: "Please select a valid address from the dropdown.",
            variant: "destructive",
          });
          return;
        }

        onAddressSelect(place.formatted_address, place);
        
        toast({
          title: "Address selected",
          description: place.formatted_address,
        });
      });

      setAutocomplete(autocompleteInstance);
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      // Don't show error toast here as it would be too intrusive
      // The component will still work as a regular input field
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${className} ${(!isLoaded || isInitializing) ? 'bg-muted/50' : 'bg-background/50'}`}
        disabled={isInitializing}
      />
      {isInitializing && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {!isLoaded && !isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded">
          Manual entry only
        </div>
      )}
    </div>
  );
};
