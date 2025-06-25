
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, Profile, UserRole } from '@/types/auth';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import { useProfileOperations } from '@/hooks/useProfileOperations';

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

  const { signUp, signIn, signOut } = useAuthOperations();
  const { fetchProfile, fetchRoles, updateProfile, checkSubscription } = useProfileOperations();

  const handleUserData = async (user: User) => {
    console.log('User authenticated, fetching profile and roles...');
    
    // Use setTimeout to prevent auth state callback issues
    setTimeout(async () => {
      const [profileData, rolesData] = await Promise.all([
        fetchProfile(user.id),
        fetchRoles(user.id)
      ]);
      
      if (profileData) setProfile(profileData);
      setRoles(rolesData);
      await checkSubscription(user);
    }, 0);
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await handleUserData(session.user);
        } else {
          console.log('User not authenticated, clearing profile and roles');
          setProfile(null);
          setRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    console.log('Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Found existing session, fetching profile and roles...');
        handleUserData(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    const result = await updateProfile(user, updates);
    
    if (!result.error) {
      // Refresh profile data
      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) setProfile(updatedProfile);
    }
    
    return result;
  };

  const hasRole = (role: 'comedian' | 'promoter' | 'admin') => {
    const hasRoleResult = roles.some(userRole => userRole.role === role);
    console.log(`Checking role ${role} for user:`, hasRoleResult, 'User roles:', roles);
    return hasRoleResult;
  };

  const value = {
    user,
    session,
    profile,
    roles,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile: handleUpdateProfile,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
