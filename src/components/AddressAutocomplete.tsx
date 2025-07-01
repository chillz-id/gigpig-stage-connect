
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();
  const { isLoaded, loadScript } = useGoogleMaps();

  useEffect(() => {
    console.log('=== ADDRESS AUTOCOMPLETE DEBUG ===');
    console.log('isLoaded:', isLoaded);
    console.log('isInitializing:', isInitializing);
    console.log('window.google exists:', !!window.google);
    
    if (!isLoaded && !isInitializing) {
      setIsInitializing(true);
      setDebugInfo('Loading Google Maps script...');
      console.log('Starting Google Maps script load...');
      
      loadScript()
        .then(() => {
          console.log('Google Maps script loaded successfully');
          setDebugInfo('Google Maps loaded, initializing autocomplete...');
          initializeAutocomplete();
        })
        .catch((error) => {
          console.error('Failed to load Google Places:', error);
          setDebugInfo(`Error loading Google Maps: ${error.message || 'Unknown error'}`);
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
      console.log('Google Maps already loaded, initializing autocomplete...');
      setDebugInfo('Initializing autocomplete...');
      initializeAutocomplete();
    }
  }, [isLoaded]);

  const initializeAutocomplete = () => {
    if (!inputRef.current) {
      console.error('Input ref not available');
      setDebugInfo('Error: Input element not found');
      return;
    }
    
    if (!window.google) {
      console.error('Google Maps not available');
      setDebugInfo('Error: Google Maps not available');
      return;
    }

    if (!window.google.maps) {
      console.error('Google Maps API not loaded');
      setDebugInfo('Error: Google Maps API not loaded');
      return;
    }

    if (!window.google.maps.places) {
      console.error('Google Places API not loaded');
      setDebugInfo('Error: Google Places API not loaded');
      return;
    }

    try {
      console.log('Creating Google Places Autocomplete instance...');
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
        console.log('Place selected:', place);
        
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
      setDebugInfo('Autocomplete initialized successfully!');
      console.log('Google Places Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setDebugInfo(`Error initializing autocomplete: ${error.message || 'Unknown error'}`);
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
      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="absolute top-full left-0 right-0 bg-black/80 text-white text-xs p-2 rounded mt-1 z-50">
          Debug: {debugInfo}
        </div>
      )}
    </div>
  );
};
