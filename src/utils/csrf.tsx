/**
 * CSRF Protection Utilities
 * 
 * Implements double-submit cookie pattern for CSRF protection
 */

import { supabase } from '@/integrations/supabase/client';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 */
export function getCsrfToken(): string {
  // Check if token exists in sessionStorage
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  
  if (!token) {
    // Generate new token
    token = generateToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    
    // Also set as a secure, httpOnly cookie (this would need backend support)
    // For now, we'll use a regular cookie
    document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; SameSite=Strict; Secure`;
  }
  
  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(requestToken: string | null): boolean {
  if (!requestToken) return false;
  
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!storedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(requestToken, storedToken);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Add CSRF token to headers
 */
export function addCsrfHeader(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCsrfToken();
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token
  };
}

/**
 * Create a hidden input field with CSRF token for forms
 */
export function createCsrfField(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = '_csrf';
  input.value = getCsrfToken();
  return input;
}

/**
 * Hook to get CSRF token in React components
 */
export function useCsrfToken(): string {
  return getCsrfToken();
}

/**
 * Enhance Supabase client with CSRF protection
 * This would need to be integrated with the Supabase client configuration
 */
export function enhanceSupabaseWithCsrf() {
  // Note: This is a conceptual implementation
  // Actual implementation would require modifying the Supabase client
  // or using a request interceptor
  
  const originalRpc = supabase.rpc;
  
  // Override RPC calls to include CSRF token
  (supabase as any).rpc = async function(fn: string, params?: any, options?: any) {
    const enhancedOptions = {
      ...options,
      headers: addCsrfHeader(options?.headers)
    };
    
    return originalRpc.call(this, fn, params, enhancedOptions);
  };
}

/**
 * React component for CSRF token field in forms
 */
export function CsrfTokenField() {
  const token = getCsrfToken();
  return <input type="hidden" name="_csrf" value={token} />;
}