import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useNavigate, useLocation } from 'react-router-dom';

interface LandingFlowProps {
  children: React.ReactNode;
}

export const LandingFlow: React.FC<LandingFlowProps> = ({ children }) => {
  const { user, profile, isLoading, isFirstLogin, markFirstLoginComplete } = useAuth();
  const { completionStatus } = useProfileCompletion();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or no user
    if (isLoading || !user || !profile) {
      return;
    }

    // Don't redirect if already on profile page
    if (location.pathname === '/profile') {
      return;
    }

    // Don't redirect if already on auth page
    if (location.pathname === '/auth') {
      return;
    }

    // Check if we should redirect to profile for completion
    const shouldRedirect = isFirstLogin || completionStatus.percentage < 40;

    if (shouldRedirect) {
      // Store the intended destination
      if (location.pathname !== '/dashboard') {
        localStorage.setItem('intendedDestination', location.pathname);
      }
      
      // Navigate to profile page
      navigate('/profile');
    }
  }, [user, profile, isLoading, isFirstLogin, completionStatus, location.pathname, navigate]);

  // If profile is complete and user was redirected, go to intended destination
  useEffect(() => {
    if (completionStatus.isComplete && isFirstLogin && location.pathname === '/profile') {
      markFirstLoginComplete();
      
      // Get intended destination or default to dashboard
      const intendedDestination = localStorage.getItem('intendedDestination') || '/dashboard';
      localStorage.removeItem('intendedDestination');
      
      navigate(intendedDestination);
    }
  }, [completionStatus.isComplete, isFirstLogin, location.pathname, navigate, markFirstLoginComplete]);

  return <>{children}</>;
};