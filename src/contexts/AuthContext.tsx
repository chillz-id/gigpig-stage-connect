
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
  hasRole: (role: 'comedian' | 'promoter' | 'admin') => boolean;
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

  const { fetchProfile, fetchRoles, updateProfile: updateUserProfile, checkSubscription } = useProfileOperations();

  console.log('AuthProvider render - user:', user?.email, 'isLoading:', isLoading, 'profile:', profile?.name);

  useEffect(() => {
    console.log('AuthProvider useEffect - setting up auth listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and roles when user is authenticated
          setTimeout(async () => {
            const userProfile = await fetchProfile(session.user.id);
            const userRoles = await fetchRoles(session.user.id);
            setProfile(userProfile);
            setRoles(userRoles);
            await checkSubscription(session.user);
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
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        const userRoles = await fetchRoles(session.user.id);
        setProfile(userProfile);
        setRoles(userRoles);
        await checkSubscription(session.user);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in:', email);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('Signing up:', email, 'with userData:', userData);
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
    console.log('Signing out');
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

  const hasRole = (role: 'comedian' | 'promoter' | 'admin') => {
    console.log('Checking role:', role, 'in roles:', roles);
    if (role === 'admin') {
      // For demo purposes, assume admin role for testing
      return true;
    }
    return roles.some(userRole => userRole.role === role);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
