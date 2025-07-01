
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
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Check if script is already in the document
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          // Wait a bit and check again
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
              setIsLoaded(true);
              resolve();
            } else {
              resolve(); // Still resolve to allow manual input
            }
          }, 1000);
          return;
        }
        
        // Create a unique callback name
        const callbackName = 'initGoogleMaps';
        
        window[callbackName] = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true);
            resolve();
          } else {
            setIsLoaded(false);
            resolve(); // Resolve to allow fallback
          }
        };

        const script = document.createElement('script');
        // Note: Using a placeholder URL - in production, you'll need a real API key
        script.src = `https://maps.googleapis.com/maps/api/js?libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        
        script.onerror = (error) => {
          // Don't reject - allow manual address entry
          setIsLoaded(false);
          resolve();
        };

        document.head.appendChild(script);
      } catch (error) {
        setIsLoaded(false);
        resolve(); // Resolve to allow fallback behavior
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
