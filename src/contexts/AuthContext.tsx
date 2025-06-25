
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
    console.log('=== HANDLING USER DATA ===');
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User email confirmed:', user.email_confirmed_at);
    
    // Use setTimeout to prevent auth state callback issues
    setTimeout(async () => {
      console.log('Fetching profile and roles for user:', user.id);
      
      const [profileData, rolesData] = await Promise.all([
        fetchProfile(user.id),
        fetchRoles(user.id)
      ]);
      
      console.log('Profile data:', profileData);
      console.log('Roles data:', rolesData);
      
      if (profileData) {
        setProfile(profileData);
        console.log('Profile set successfully');
      } else {
        console.log('No profile data found');
      }
      
      setRoles(rolesData);
      console.log('Roles set:', rolesData);
      
      await checkSubscription(user);
      console.log('Subscription check completed');
    }, 0);
  };

  useEffect(() => {
    console.log('=== SETTING UP AUTH STATE LISTENER ===');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE ===');
        console.log('Event:', event);
        console.log('Session exists:', !!session);
        console.log('User exists:', !!session?.user);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated, handling user data...');
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
    console.log('=== CHECKING FOR EXISTING SESSION ===');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check result:', !!session);
      if (session) {
        console.log('Found existing session for:', session.user.email);
      }
      
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
    console.log(`=== ROLE CHECK ===`);
    console.log(`Checking role: ${role}`);
    console.log(`User roles:`, roles);
    console.log(`Has role: ${hasRoleResult}`);
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

  console.log('=== AUTH CONTEXT STATE ===');
  console.log('User:', !!user);
  console.log('Session:', !!session);
  console.log('Profile:', !!profile);
  console.log('Roles count:', roles.length);
  console.log('Is loading:', isLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
