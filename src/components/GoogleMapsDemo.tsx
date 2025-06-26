
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleMapsComponent } from './GoogleMapsComponent';
import { AddressAutocomplete } from './AddressAutocomplete';
import { MapPin, Navigation } from 'lucide-react';

export const GoogleMapsDemo: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const handleAddressSelect = (address: string, lat?: number, lng?: number) => {
    setSelectedAddress(address);
    if (lat && lng) {
      setSelectedCoordinates({ lat, lng });
    }
  };

  const handleAutocompleteSelect = (address: string, placeDetails?: any) => {
    setSelectedAddress(address);
    if (placeDetails?.geometry?.location) {
      setSelectedCoordinates({
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng()
      });
    }
  };

  const openInGoogleMaps = () => {
    if (selectedAddress) {
      const encodedAddress = encodeURIComponent(selectedAddress);
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Google Maps Integration Demo</h1>
        <p className="text-muted-foreground">
          This demo shows how Google Maps JavaScript API and Places API work in the platform
        </p>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="autocomplete">Address Autocomplete</TabsTrigger>
          <TabsTrigger value="integration">Full Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Google Map</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This map allows you to search for addresses, drag markers, and select locations.
              </p>
              <GoogleMapsComponent
                onAddressSelect={handleAddressSelect}
                height="500px"
                showAddressInput={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="autocomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Address Autocomplete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This component provides address suggestions as you type, powered by Google Places API.
              </p>
              <AddressAutocomplete
                onAddressSelect={handleAutocompleteSelect}
                placeholder="Start typing an Australian address..."
                showSetupCard={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Location Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Use this component when creating events to set venue locations.
                </p>
                <GoogleMapsComponent
                  onAddressSelect={handleAddressSelect}
                  height="300px"
                  showAddressInput={true}
                  defaultAddress="Sydney Opera House, Sydney NSW, Australia"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Selected Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAddress ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Address:</p>
                        <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                      </div>
                    </div>
                    
                    {selectedCoordinates && (
                      <div className="text-sm text-muted-foreground">
                        <p>Coordinates: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}</p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={openInGoogleMaps}
                      className="w-full flex items-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No location selected</p>
                    <p className="text-sm text-muted-foreground">
                      Use the map or autocomplete to select a location
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Required Google Cloud APIs:</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>Maps JavaScript API - For interactive maps</li>
              <li>Places API - For address autocomplete and place details</li>
              <li>Geocoding API - For converting addresses to coordinates</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Features:</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>Address autocomplete restricted to Australia</li>
              <li>Draggable markers for precise location selection</li>
              <li>Reverse geocoding to get addresses from coordinates</li>
              <li>Integration with existing event creation workflow</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Security:</p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground">
              <li>API keys are stored securely and not exposed in code</li>
              <li>Requests are restricted to Australian addresses</li>
              <li>Rate limiting and usage monitoring recommended</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
