
import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  roles: ('comedian' | 'promoter')[];
  membership: 'free' | 'pro' | 'premium';
  bio?: string;
  location?: string;
  joinDate?: string;
  stats: {
    totalGigs: number;
    totalEarnings: number;
    successRate: number;
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
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Alex Thompson',
    email: 'alex@comedy.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    roles: ['comedian', 'promoter'],
    membership: 'pro',
    bio: 'Stand-up comedian with 8+ years of experience. Love observational humor and connecting with audiences through relatable stories.',
    location: 'Los Angeles, CA',
    joinDate: 'March 2020',
    stats: {
      totalGigs: 47,
      totalEarnings: 3420,
      successRate: 68,
      averageRating: 4.7,
      totalEvents: 12,
      totalRevenue: 8960,
      activeGroups: 5,
    },
  });
  const [isLoading] = useState(false);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};
