
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
          toast({
            title: "Maps loading failed",
            description: "Unable to load address autocomplete. Please check your API key configuration.",
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
      toast({
        title: "Autocomplete initialization failed",
        description: "Please verify your Google Maps API key is valid and has Places API enabled.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${className} ${(!isLoaded || isInitializing) ? 'bg-muted/50' : 'bg-background/50'}`}
        disabled={!isLoaded || isInitializing}
      />
      {(!isLoaded || isInitializing) && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
