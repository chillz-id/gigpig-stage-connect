
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useProfileOperations } from '@/hooks/useProfileOperations';
import { Profile, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  hasRole: (role: 'guest' | 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin') => boolean;
  isCoPromoterForEvent: (eventId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchProfile, fetchRoles, updateProfile: updateUserProfile } = useProfileOperations();


  useEffect(() => {
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and roles when user is authenticated
          setTimeout(async () => {
            const userProfile = await fetchProfile(session.user.id);
            const userRoles = await fetchRoles(session.user.id);
            setProfile(userProfile);
            setRoles(userRoles);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        const userRoles = await fetchRoles(session.user.id);
        setProfile(userProfile);
        setRoles(userRoles);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('AuthContext signIn error:', error);
    }
    setIsLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userData
      }
    });
    setIsLoading(false);
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    const result = await updateUserProfile(user, updates);
    if (!result.error) {
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return result;
  };

  const hasRole = (role: 'guest' | 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin') => {
    const hasTheRole = roles.some(userRole => userRole.role === role);
    return hasTheRole;
  };

  const isCoPromoterForEvent = async (eventId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_co_promoter_for_event', {
        _user_id: user.id,
        _event_id: eventId
      });
      
      if (error) {
        console.error('Error checking co-promoter status:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('Error checking co-promoter status:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    profile,
    roles,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    isCoPromoterForEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
