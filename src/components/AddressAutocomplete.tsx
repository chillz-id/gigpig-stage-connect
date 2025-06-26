
import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [apiKey, setApiKey] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
      return;
    }

    // If no API key is set and we should show setup card, return early
    if (!apiKey && showSetupCard) {
      return;
    }

    // For components that don't show setup card, try to use existing global API key
    if (!apiKey) {
      // You could check for a global API key here or in local storage
      return;
    }

    // Load Google Maps script with Places library
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = initializeAutocomplete;

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'au' }, // Restrict to Australia
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
      setIsLoaded(true);
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      toast({
        title: "Autocomplete initialization failed",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your Google Maps API key.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Loading Google Places",
      description: "Please wait while we initialize address autocomplete...",
    });
  };

  if (!apiKey && showSetupCard) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Places API Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            To enable address autocomplete, please enter your Google Places API key. 
            You can get one from the{' '}
            <a 
              href="https://console.cloud.google.com/google/maps-apis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>.
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your Google Places API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background/50"
            />
            <Button type="submit" className="w-full">
              Enable Address Autocomplete
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${className} ${!isLoaded ? 'bg-muted/50' : 'bg-background/50'}`}
        disabled={!isLoaded && !apiKey}
      />
      {!isLoaded && apiKey && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
