
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapsComponentProps {
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
  defaultAddress?: string;
  height?: string;
  showAddressInput?: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({
  onAddressSelect,
  defaultAddress,
  height = '400px',
  showAddressInput = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // If no API key is set, show input
    if (!apiKey) {
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = initializeMap;

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      // Default to Sydney, Australia
      const defaultLocation = { lat: -33.8688, lng: 151.2093 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      const markerInstance = new window.google.maps.Marker({
        position: defaultLocation,
        map: mapInstance,
        draggable: true,
        title: 'Event Location'
      });

      // Add marker drag listener
      markerInstance.addListener('dragend', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const address = results[0].formatted_address;
            if (onAddressSelect) {
              onAddressSelect(address, lat, lng);
            }
            toast({
              title: "Location updated",
              description: `New location: ${address}`,
            });
          }
        });
      });

      setMap(mapInstance);
      setMarker(markerInstance);

      // Initialize autocomplete if input exists
      if (autocompleteRef.current && showAddressInput) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'au' }, // Restrict to Australia
          }
        );

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            toast({
              title: "Address not found",
              description: "Please select a valid address from the dropdown.",
              variant: "destructive",
            });
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address;

          // Update map and marker
          mapInstance.setCenter({ lat, lng });
          markerInstance.setPosition({ lat, lng });

          if (onAddressSelect) {
            onAddressSelect(address, lat, lng);
          }

          toast({
            title: "Address selected",
            description: address,
          });
        });

        setAutocomplete(autocompleteInstance);
      }

      // If default address is provided, geocode it
      if (defaultAddress) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: defaultAddress }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            mapInstance.setCenter(location);
            markerInstance.setPosition(location);
          }
        });
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      toast({
        title: "Maps initialization failed",
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
      title: "Loading Google Maps",
      description: "Please wait while we load the map...",
    });
  };

  if (!apiKey) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Maps Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            To use Google Maps functionality, please enter your Google Maps API key. 
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
              placeholder="Enter your Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background/50"
            />
            <Button type="submit" className="w-full">
              Load Google Maps
            </Button>
          </form>
          <div className="text-xs text-muted-foreground">
            <p>Required APIs:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Maps JavaScript API</li>
              <li>Places API</li>
              <li>Geocoding API</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Event Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddressInput && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={autocompleteRef}
              placeholder="Search for an address..."
              className="pl-10 bg-background/50"
              disabled={!isLoaded}
            />
          </div>
        )}
        
        <div 
          ref={mapRef} 
          style={{ height }} 
          className="rounded-lg border border-border bg-muted/20"
        >
          {!isLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>
        
        {isLoaded && (
          <p className="text-xs text-muted-foreground">
            Drag the marker to adjust the location or use the search box above.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
