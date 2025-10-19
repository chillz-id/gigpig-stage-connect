import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  roles: ('comedian' | 'promoter' | 'member')[];
  bio?: string;
  location?: string;
  joinDate?: string;
  stats: {
    totalGigs: number;
    totalEarnings: number;
    showsPerformed: number;
    averageRating: number;
    totalEvents?: number;
    totalRevenue?: number;
    activeGroups?: number;
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // In a real app, you'd also clear tokens, redirect to login, etc.
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        return { ...currentUser, ...updates };
      }
      return currentUser;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    updateUser
  }), [user, isLoading, login, logout, updateUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
