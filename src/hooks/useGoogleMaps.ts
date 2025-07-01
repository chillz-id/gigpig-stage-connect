
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
    console.log('=== GOOGLE MAPS HOOK DEBUG ===');
    console.log('Checking if Google Maps is already loaded...');
    
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google Maps already loaded and ready');
      setIsLoaded(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('Loading Google Maps script...');
        
        // Check if script is already in the document
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          console.log('Google Maps script already exists in document');
          // Wait a bit and check again
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
              console.log('Google Maps loaded via existing script');
              setIsLoaded(true);
              resolve();
            } else {
              console.error('Google Maps script exists but API not available');
              resolve(); // Still resolve to allow manual input
            }
          }, 1000);
          return;
        }
        
        // Create a unique callback name
        const callbackName = 'initGoogleMaps';
        
        window[callbackName] = () => {
          console.log('Google Maps callback triggered');
          if (window.google && window.google.maps && window.google.maps.places) {
            console.log('Google Maps fully loaded with Places API');
            setIsLoaded(true);
            resolve();
          } else {
            console.error('Google Maps callback triggered but API incomplete');
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
          console.error('Google Maps script failed to load:', error);
          console.error('This is likely because:');
          console.error('1. No Google Maps API key is configured');
          console.error('2. API key is invalid or has restrictions');
          console.error('3. Billing is not set up for the Google Cloud project');
          console.error('4. The Places API is not enabled');
          
          // Don't reject - allow manual address entry
          setIsLoaded(false);
          resolve();
        };

        console.log('Adding Google Maps script to document...');
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error setting up Google Maps script:', error);
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
