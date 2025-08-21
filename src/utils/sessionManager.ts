import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export class SessionManager {
  private static instance: SessionManager;
  private refreshPromise: Promise<Session | null> | null = null;
  
  private constructor() {}
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  /**
   * Get current session with automatic refresh if needed
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[SessionManager] Error getting session:', error);
        return null;
      }
      
      // Check if session needs refresh (expires in less than 60 seconds)
      if (session && this.shouldRefreshSession(session)) {
        return this.refreshSession();
      }
      
      return session;
    } catch (error) {
      console.error('[SessionManager] Exception getting session:', error);
      return null;
    }
  }
  
  /**
   * Check if session should be refreshed
   */
  private shouldRefreshSession(session: Session): boolean {
    if (!session.expires_at) return false;
    
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // Refresh if less than 60 seconds until expiry
    return timeUntilExpiry < 60 * 1000;
  }
  
  /**
   * Refresh the session
   */
  async refreshSession(): Promise<Session | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.doRefreshSession();
    
    try {
      const session = await this.refreshPromise;
      return session;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  private async doRefreshSession(): Promise<Session | null> {
    console.log('[SessionManager] Refreshing session...');
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[SessionManager] Error refreshing session:', error);
        return null;
      }
      
      console.log('[SessionManager] Session refreshed successfully');
      return session;
    } catch (error) {
      console.error('[SessionManager] Exception refreshing session:', error);
      return null;
    }
  }
  
  /**
   * Get headers for authenticated requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await this.getSession();
    
    if (!session?.access_token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }
  
  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.user?.id || null;
  }
  
  /**
   * Handle authentication error by attempting to refresh session
   */
  async handleAuthError(error: any): Promise<boolean> {
    // Check if error is auth-related
    if (
      error.status === 401 ||
      error.message?.toLowerCase().includes('jwt') ||
      error.message?.toLowerCase().includes('token') ||
      error.message?.toLowerCase().includes('unauthorized')
    ) {
      console.log('[SessionManager] Auth error detected, attempting refresh...');
      const newSession = await this.refreshSession();
      return !!newSession;
    }
    
    return false;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();