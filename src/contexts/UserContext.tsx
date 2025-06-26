
import React, { createContext, useContext, useState } from 'react';

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
  switchToUser: (userType: 'comedian' | 'promoter' | 'member') => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Mock users for different personas (updated without subscription data)
const mockUsers = {
  comedian: {
    id: '1',
    name: 'Alex Thompson',
    email: 'alex@comedy.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    roles: ['comedian', 'promoter'] as ('comedian' | 'promoter' | 'member')[],
    bio: 'Stand-up comedian with 8+ years of experience. Love observational humor and connecting with audiences through relatable stories.',
    location: 'Los Angeles, CA',
    joinDate: 'March 2020',
    stats: {
      totalGigs: 47,
      totalEarnings: 3420,
      showsPerformed: 50,
      averageRating: 4.7,
      totalEvents: 12,
      totalRevenue: 8960,
      activeGroups: 5,
    },
  },
  promoter: {
    id: '2',
    name: 'Sarah Mitchell',
    email: 'sarah@promoter.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b793?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    roles: ['promoter'] as ('comedian' | 'promoter' | 'member')[],
    bio: 'Event promoter specializing in comedy shows. Passionate about bringing the best comedic talent to Sydney venues.',
    location: 'Sydney, NSW',
    joinDate: 'January 2021',
    stats: {
      totalGigs: 0,
      totalEarnings: 0,
      showsPerformed: 0,
      averageRating: 0,
      totalEvents: 25,
      totalRevenue: 15000,
      activeGroups: 8,
    },
  },
  member: {
    id: '3',
    name: 'Chris Hill',
    email: 'chillz.id@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: false,
    roles: ['member'] as ('comedian' | 'promoter' | 'member')[],
    bio: 'Comedy enthusiast and regular show attendee. Love supporting local comedians!',
    location: 'Sydney, NSW',
    joinDate: 'June 2024',
    stats: {
      totalGigs: 0,
      totalEarnings: 0,
      showsPerformed: 0,
      averageRating: 0,
      totalEvents: 0,
      totalRevenue: 0,
      activeGroups: 0,
    },
  },
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUsers.comedian);
  const [isLoading] = useState(false);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    // In a real app, you'd also clear tokens, redirect to login, etc.
    window.location.href = '/';
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const switchToUser = (userType: 'comedian' | 'promoter' | 'member') => {
    setUser(mockUsers[userType]);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser, switchToUser }}>
      {children}
    </UserContext.Provider>
  );
};
