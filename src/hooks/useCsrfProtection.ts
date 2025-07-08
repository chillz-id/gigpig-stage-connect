import { useEffect } from 'react';
import { getCsrfToken, addCsrfHeader } from '@/utils/csrf';

/**
 * Hook to provide CSRF protection for forms and API calls
 */
export function useCsrfProtection() {
  // Initialize CSRF token on mount
  useEffect(() => {
    getCsrfToken();
  }, []);
  
  /**
   * Wrap fetch calls with CSRF protection
   */
  const protectedFetch = async (url: string, options: RequestInit = {}) => {
    const enhancedOptions: RequestInit = {
      ...options,
      headers: addCsrfHeader(options.headers as Record<string, string>),
      credentials: 'same-origin' // Ensure cookies are sent
    };
    
    return fetch(url, enhancedOptions);
  };
  
  /**
   * Get headers with CSRF token for API calls
   */
  const getProtectedHeaders = (additionalHeaders: Record<string, string> = {}) => {
    return addCsrfHeader(additionalHeaders);
  };
  
  /**
   * Get CSRF token for manual inclusion
   */
  const token = getCsrfToken();
  
  return {
    token,
    protectedFetch,
    getProtectedHeaders
  };
}