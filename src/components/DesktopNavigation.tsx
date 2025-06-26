import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import MemberViewNavigation from './navigation/MemberViewNavigation';
import ComedianViewNavigation from './navigation/ComedianViewNavigation';
import PromoterViewNavigation from './navigation/PromoterViewNavigation';
import QuickActionButtons from './navigation/QuickActionButtons';

const DesktopNavigation: React.FC = () => {
  const { user } = useUser();
  const { isMemberView, isComedianView } = useViewMode();

  // Helper function to check if user has a specific role
  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <div className="hidden md:flex items-center space-x-8">
      {/* Member View Navigation */}
      {isMemberView && <MemberViewNavigation user={user} />}

      {/* Comedian View Navigation */}
      {isComedianView && <ComedianViewNavigation />}

      {/* Promoter View Navigation (unchanged) */}
      {!isMemberView && !isComedianView && (
        <PromoterViewNavigation hasRole={hasRole} isComedianView={isComedianView} />
      )}
      
      {/* Quick Action Buttons */}
      <QuickActionButtons 
        user={user}
        isMemberView={isMemberView}
        isComedianView={isComedianView}
        hasRole={hasRole}
      />
    </div>
  );
};

export default DesktopNavigation;
