
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import { useProfileOperations } from '@/hooks/useProfileOperations';
import { Profile, UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isFirstLogin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  hasRole: (role: 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer') => boolean;
  hasAnyRole: (roles: Array<'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer'>) => boolean;
  isCoPromoterForEvent: (eventId: string) => Promise<boolean>;
  markFirstLoginComplete: () => void;
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
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const { signIn: authSignIn, signUp: authSignUp, signOut: authSignOut } = useAuthOperations();
  const { fetchProfile, fetchRoles, updateProfile: updateUserProfile } = useProfileOperations();

  useEffect(() => {
    // Setting up auth listener
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and roles when user is authenticated
          setTimeout(async () => {
            try {
              // Fetching user data
              let userProfile = await fetchProfile(session.user.id);
              let userRoles = await fetchRoles(session.user.id);
              
              // If profile doesn't exist (OAuth user), wait and try again
              if (!userProfile && event === 'SIGNED_IN') {
                // Profile not found, waiting for trigger
                await new Promise(resolve => setTimeout(resolve, 2000));
                userProfile = await fetchProfile(session.user.id);
                userRoles = await fetchRoles(session.user.id);
                
                // If still no profile, create one
                if (!userProfile) {
                  console.log('Creating profile for user:', session.user.email);
                  const { error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email!,
                      name: session.user.user_metadata?.name || 
                            session.user.user_metadata?.full_name || 
                            session.user.email!.split('@')[0],
                      first_name: session.user.user_metadata?.first_name || '',
                      last_name: session.user.user_metadata?.last_name || '',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    });
                  
                  if (!createError) {
                    // Try fetching the profile again
                    userProfile = await fetchProfile(session.user.id);
                    
                    // Create default role
                    const { error: roleError } = await supabase
                      .from('user_roles')
                      .insert({
                        user_id: session.user.id,
                        role: session.user.user_metadata?.role || 'member',
                        created_at: new Date().toISOString()
                      });
                    
                    if (!roleError) {
                      userRoles = await fetchRoles(session.user.id);
                    }
                  } else {
                    console.error('Failed to create profile:', createError.message);
                  }
                }
                
                // If this is a new user, mark as first login
                if (userProfile) {
                  setIsFirstLogin(true);
                  localStorage.setItem('isFirstLogin', 'true');
                }
              }
              
              // Check if this is a first login for existing profile
              if (userProfile && event === 'SIGNED_IN') {
                const lastLogin = localStorage.getItem('lastLogin');
                const profileCreated = new Date(userProfile.created_at);
                const now = new Date();
                
                // If no last login recorded or profile is less than 1 day old, consider it first login
                if (!lastLogin || (now.getTime() - profileCreated.getTime()) < 24 * 60 * 60 * 1000) {
                  setIsFirstLogin(true);
                  localStorage.setItem('isFirstLogin', 'true');
                }
                
                // Update last login timestamp
                localStorage.setItem('lastLogin', now.toISOString());
              }
              
              // User data fetched successfully
              setProfile(userProfile);
              setRoles(userRoles);
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsFirstLogin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      
      // Processing initial session
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          let userProfile = await fetchProfile(session.user.id);
          let userRoles = await fetchRoles(session.user.id);
          
          // If no profile exists, create one
          if (!userProfile) {
            console.log('No profile found for initial session, creating...');
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || 
                      session.user.user_metadata?.full_name || 
                      session.user.email!.split('@')[0],
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (!createError) {
              userProfile = await fetchProfile(session.user.id);
              
              // Create default role
              await supabase
                .from('user_roles')
                .insert({
                  user_id: session.user.id,
                  role: session.user.user_metadata?.role || 'member',
                  created_at: new Date().toISOString()
                });
              
              userRoles = await fetchRoles(session.user.id);
            }
          }
          
          setProfile(userProfile);
          setRoles(userRoles);
        } catch (error) {
          console.error('Error fetching initial user data:', error);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Processing sign in
    return await authSignIn(email, password);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    // Processing sign up
    return await authSignUp(email, password, userData);
  };

  const signOut = async () => {
    // Processing sign out
    await authSignOut();
    setProfile(null);
    setRoles([]);
    setIsFirstLogin(false);
    localStorage.removeItem('isFirstLogin');
    localStorage.removeItem('lastLogin');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    const result = await updateUserProfile(user, updates);
    if (!result.error) {
      // Update local profile state immediately
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Also refetch profile to ensure we have the latest data
      const latestProfile = await fetchProfile(user.id);
      if (latestProfile) {
        setProfile(latestProfile);
      }
    }
    return result;
  };

  const hasRole = (role: 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer') => {
    const hasTheRole = roles.some(userRole => userRole.role === role);
    // Checking user role
    return hasTheRole;
  };

  const hasAnyRole = (checkRoles: Array<'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin' | 'photographer' | 'videographer'>) => {
    return roles.some(userRole => checkRoles.includes(userRole.role));
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

  const markFirstLoginComplete = () => {
    setIsFirstLogin(false);
    localStorage.setItem('isFirstLogin', 'false');
  };

  const value = {
    user,
    session,
    profile,
    roles,
    isLoading,
    isFirstLogin,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    hasAnyRole,
    isCoPromoterForEvent,
    markFirstLoginComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
