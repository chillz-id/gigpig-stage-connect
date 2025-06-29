
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleMapsConfig {
  isLoaded: boolean;
  loadScript: () => Promise<void>;
  geocode: (address: string) => Promise<any>;
  reverseGeocode: (lat: number, lng: number) => Promise<any>;
  searchPlaces: (input: string) => Promise<any>;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const useGoogleMaps = (): GoogleMapsConfig => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const loadScript = async (): Promise<void> => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a unique callback name
        const callbackName = 'initGoogleMaps';
        
        window[callbackName] = () => {
          setIsLoaded(true);
          resolve();
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  };

  const geocode = async (address: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: { action: 'geocode', address }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding failed",
        description: "Unable to find location for the provided address.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: { action: 'reverseGeocode', lat, lng }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: "Location lookup failed",
        description: "Unable to get address for the selected location.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const searchPlaces = async (input: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: { action: 'places', input }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Places search error:', error);
      toast({
        title: "Places search failed",
        description: "Unable to search for places.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    isLoaded,
    loadScript,
    geocode,
    reverseGeocode,
    searchPlaces
  };
};
