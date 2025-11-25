import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OGMetadata {
  url: string;
  image: string | null;
  title: string;
  description: string | null;
  success: boolean;
}

export interface OGError {
  error: string;
  success: false;
}

type OGResponse = OGMetadata | OGError;

/**
 * Hook for fetching Open Graph metadata from URLs
 * Calls the fetch-og-metadata Edge Function
 */
export const useOGFetch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOGData = async (url: string): Promise<OGMetadata | null> => {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      setError('Invalid URL');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the Edge Function
      const { data, error: functionError } = await supabase.functions.invoke<OGResponse>(
        'fetch-og-metadata',
        {
          body: { url },
        }
      );

      if (functionError) {
        console.error('Edge Function error:', functionError);
        setError(functionError.message || 'Failed to fetch metadata');
        return null;
      }

      if (!data) {
        setError('No data returned from Edge Function');
        return null;
      }

      // Check if response indicates success
      if (!data.success) {
        const errorData = data as OGError;
        setError(errorData.error || 'Failed to fetch Open Graph metadata');
        return null;
      }

      const metadata = data as OGMetadata;

      // Return the metadata
      return {
        url: metadata.url,
        image: metadata.image,
        title: metadata.title,
        description: metadata.description,
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('OG fetch error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchOGData,
    isLoading,
    error,
  };
};
