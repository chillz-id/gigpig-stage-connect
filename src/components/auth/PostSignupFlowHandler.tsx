import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { OrganizationSignupWizard } from './OrganizationSignupWizard';
import { ManagerSignupWizard } from './ManagerSignupWizard';
import { useNavigate } from 'react-router-dom';

type FlowType = 'organization' | 'manager' | 'complete';

interface PostSignupFlowHandlerProps {
  onComplete?: () => void;
}

/**
 * Orchestrates post-signup flow based on user roles
 * - If user selected "organization" role: show OrganizationSignupWizard
 * - If user selected "manager" role: show ManagerSignupWizard
 * - User can skip any wizard and complete later
 */
export const PostSignupFlowHandler: React.FC<PostSignupFlowHandlerProps> = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [currentFlow, setCurrentFlow] = useState<FlowType | null>(null);

  useEffect(() => {
    if (!user) return;

    // Determine which flow to show based on roles
    // Priority: organization > manager
    // Note: user.roles is an array of role strings
    const roles = user.roles || [];

    if (roles.includes('organization') || roles.includes('venue_manager')) {
      setCurrentFlow('organization');
    } else if (roles.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      // No special flows needed (comedian, comedian_lite, photographer, etc.)
      setCurrentFlow('complete');
    }
  }, [user]);

  const handleOrganizationComplete = () => {
    // After organization flow, check if they also need manager flow
    if (user?.roles?.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      handleAllComplete();
    }
  };

  const handleOrganizationSkip = () => {
    // Skip organization flow, check if manager flow needed
    if (user?.roles?.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      handleAllComplete();
    }
  };

  const handleManagerComplete = () => {
    handleAllComplete();
  };

  const handleManagerSkip = () => {
    handleAllComplete();
  };

  const handleAllComplete = () => {
    setCurrentFlow('complete');

    // Call parent onComplete callback if provided
    if (onComplete) {
      onComplete();
    }

    // Navigate to appropriate dashboard based on role
    const roles = user?.roles || [];

    if (roles.includes('promoter')) {
      navigate('/create-event');
    } else if (roles.includes('comedian') || roles.includes('comedian_lite')) {
      // comedian_lite users should go to /gigs to browse opportunities
      navigate('/gigs');
    } else if (roles.includes('photographer')) {
      navigate('/');
    } else if (roles.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  if (!user || currentFlow === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (currentFlow === 'complete') {
    // Flow is complete, navigation will happen automatically
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {currentFlow === 'organization' && (
        <OrganizationSignupWizard
          userId={user.id}
          onComplete={handleOrganizationComplete}
          onSkip={handleOrganizationSkip}
        />
      )}

      {currentFlow === 'manager' && (
        <ManagerSignupWizard
          userId={user.id}
          onComplete={handleManagerComplete}
          onSkip={handleManagerSkip}
        />
      )}
    </div>
  );
};
