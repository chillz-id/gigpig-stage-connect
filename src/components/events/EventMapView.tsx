import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import type { BrowseEvent } from '@/services/event/event-browse-service';
import { MapPin } from 'lucide-react';

interface EventMapViewProps {
  events: BrowseEvent[];
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string | null;
  height?: string;
}

interface MarkerEntry {
  marker: google.maps.Marker;
  eventId: string;
}

const MAX_GEOCODE_EVENTS = 50;

export const EventMapView: React.FC<EventMapViewProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
  height = '480px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const geocodeCacheRef = useRef<Record<string, google.maps.LatLngLiteral>>({});
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { toast } = useToast();
  const { isLoaded, loadScript } = useGoogleMaps();
  const [isInitializing, setIsInitializing] = useState(false);

  const eventsWithLocation = useMemo(() => {
    return events.filter((event) => {
      const hasCoordinates =
        !!event.coordinates &&
        typeof event.coordinates.latitude === 'number' &&
        typeof event.coordinates.longitude === 'number';
      const hasAddress = Boolean(event.address || event.venue || event.city);
      return hasCoordinates || hasAddress;
    });
  }, [events]);

  const initializeMap = useCallback(() => {
    if (!window.google || !mapRef.current) {
      return;
    }

    if (!mapInstanceRef.current) {
      const defaultCenter: google.maps.LatLngLiteral = {
        lat: -33.8688,
        lng: 151.2093,
      }; // Sydney default

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 11,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });
    }

    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((entry) => entry.marker.setMap(null));
    markersRef.current = [];
  }, []);

  const geocodeEvent = useCallback(
    (event: BrowseEvent): Promise<google.maps.LatLngLiteral | null> => {
      if (!geocoderRef.current) {
        return Promise.resolve(null);
      }

      const cacheKey = `${event.id}`;
      if (geocodeCacheRef.current[cacheKey]) {
        return Promise.resolve(geocodeCacheRef.current[cacheKey]);
      }

      const addressQuery = event.address
        ? `${event.address}, ${event.city ?? ''} ${event.state ?? ''}`
        : `${event.venue}, ${event.city ?? ''} ${event.state ?? ''}`;

      if (!addressQuery.trim()) {
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        geocoderRef.current!.geocode(
          { address: addressQuery },
          (results, status) => {
            if (status === 'OK' && results && results[0]?.geometry?.location) {
              const location = results[0].geometry.location;
              const latLng = { lat: location.lat(), lng: location.lng() };
              geocodeCacheRef.current[cacheKey] = latLng;
              resolve(latLng);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google) {
      return;
    }

    clearMarkers();

    const relevantEvents = eventsWithLocation.slice(0, MAX_GEOCODE_EVENTS);

    const bounds = new window.google.maps.LatLngBounds();
    let addedAnyMarker = false;

    for (const event of relevantEvents) {
      let latLng: google.maps.LatLngLiteral | null = null;

      if (
        event.coordinates &&
        typeof event.coordinates.latitude === 'number' &&
        typeof event.coordinates.longitude === 'number'
      ) {
        latLng = {
          lat: event.coordinates.latitude,
          lng: event.coordinates.longitude,
        };
      } else {
        latLng = await geocodeEvent(event);
      }

      if (!latLng) continue;

      const marker = new window.google.maps.Marker({
        position: latLng,
        map: mapInstanceRef.current,
        title: event.title,
      });

      marker.addListener('click', () => {
        onSelectEvent?.(event.id);
      });

      markersRef.current.push({ marker, eventId: event.id });
      bounds.extend(latLng);
      addedAnyMarker = true;
    }

    if (addedAnyMarker) {
      try {
        mapInstanceRef.current.fitBounds(bounds, 80);
      } catch (error) {
        console.warn('[EventMapView] fitBounds error:', error);
      }
    }
  }, [clearMarkers, eventsWithLocation, geocodeEvent, onSelectEvent]);

  useEffect(() => {
    if (!isLoaded && !isInitializing) {
      setIsInitializing(true);
      loadScript()
        .then(() => {
          initializeMap();
          updateMarkers();
        })
        .catch((error) => {
          console.error('[EventMapView] Failed to load Google Maps:', error);
          toast({
            title: 'Map unavailable',
            description: 'We could not load Google Maps. Please check your API key configuration.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else if (isLoaded) {
      initializeMap();
      updateMarkers();
    }

    return () => {
      clearMarkers();
    };
  }, [initializeMap, updateMarkers, isLoaded, isInitializing, loadScript, toast, clearMarkers]);

  useEffect(() => {
    if (!selectedEventId || markersRef.current.length === 0 || !mapInstanceRef.current) {
      return;
    }

    const entry = markersRef.current.find((marker) => marker.eventId === selectedEventId);
    if (entry) {
      mapInstanceRef.current.panTo(entry.marker.getPosition()!);
      mapInstanceRef.current.setZoom(13);
      entry.marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        entry.marker.setAnimation(null);
      }, 1200);
    }
  }, [selectedEventId]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Shows Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="rounded-lg border border-border" style={{ height }}>
          {(!isLoaded || isInitializing) && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading map…
            </div>
          )}
          {isLoaded && eventsWithLocation.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-center px-6">
              No events with mappable addresses in this range yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
