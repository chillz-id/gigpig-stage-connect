
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GoogleMapsComponentProps {
  onAddressSelect?: (address: string, lat: number, lng: number) => void;
  defaultAddress?: string;
  height?: string;
  showAddressInput?: boolean;
}

declare global {
  interface Window {
    google: any;
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
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const { isLoaded, loadScript, reverseGeocode } = useGoogleMaps();

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

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
      markerInstance.addListener('dragend', async (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        try {
          const result = await reverseGeocode(lat, lng);
          if (result.results && result.results[0]) {
            const address = result.results[0].formatted_address;
            if (onAddressSelect) {
              onAddressSelect(address, lat, lng);
            }
            toast({
              title: "Location updated",
              description: `New location: ${address}`,
            });
          }
        } catch (error) {
          console.error('Error getting address:', error);
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);

      // Initialize autocomplete if input exists
      if (autocompleteRef.current && showAddressInput) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'au' },
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
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      toast({
        title: "Maps initialization failed",
        description: "Please verify your Google Maps API key is valid and has the required APIs enabled.",
        variant: "destructive",
      });
    }
  }, [defaultAddress, onAddressSelect, reverseGeocode, showAddressInput, toast]);

  useEffect(() => {
    if (!isLoaded && !isInitializing) {
      setIsInitializing(true);
      loadScript()
        .then(() => {
          initializeMap();
        })
        .catch((error) => {
          console.error('Failed to load Google Maps:', error);
          toast({
            title: "Maps loading failed",
            description: "Unable to load Google Maps. Please check your API key configuration.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else if (isLoaded) {
      initializeMap();
    }
  }, [initializeMap, isInitializing, isLoaded, loadScript, toast]);

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
          {(!isLoaded || isInitializing) && (
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
