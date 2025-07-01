
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOperations } from '@/hooks/useAuthOperations';
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

  const { signIn: authSignIn, signUp: authSignUp, signOut: authSignOut } = useAuthOperations();
  const { fetchProfile, fetchRoles, updateProfile: updateUserProfile } = useProfileOperations();

  useEffect(() => {
    console.log('=== SETTING UP AUTH LISTENER ===');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and roles when user is authenticated
          setTimeout(async () => {
            try {
              console.log('=== FETCHING USER DATA ===');
              let userProfile = await fetchProfile(session.user.id);
              let userRoles = await fetchRoles(session.user.id);
              
              // If profile doesn't exist (OAuth user), wait and try again
              if (!userProfile && event === 'SIGNED_IN') {
                console.log('=== PROFILE NOT FOUND, WAITING FOR TRIGGER ===');
                await new Promise(resolve => setTimeout(resolve, 2000));
                userProfile = await fetchProfile(session.user.id);
                userRoles = await fetchRoles(session.user.id);
              }
              
              console.log('=== USER DATA FETCHED ===', { profile: userProfile, roles: userRoles });
              setProfile(userProfile);
              setRoles(userRoles);
            } catch (error) {
              console.error('=== ERROR FETCHING USER DATA ===', error);
            }
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
      
      console.log('=== INITIAL SESSION ===', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const userProfile = await fetchProfile(session.user.id);
          const userRoles = await fetchRoles(session.user.id);
          setProfile(userProfile);
          setRoles(userRoles);
        } catch (error) {
          console.error('=== ERROR FETCHING INITIAL USER DATA ===', error);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('=== CONTEXT SIGN IN ===', email);
    return await authSignIn(email, password);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('=== CONTEXT SIGN UP ===', email, userData);
    return await authSignUp(email, password, userData);
  };

  const signOut = async () => {
    console.log('=== CONTEXT SIGN OUT ===');
    await authSignOut();
    setProfile(null);
    setRoles([]);
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
    console.log('=== CHECKING ROLE ===', role, hasTheRole, roles);
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
