import { ReactNode } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedSidebar } from './UnifiedSidebar';
import { PlatformMobileNav } from './PlatformMobileNav';

/**
 * Platform Layout Component
 *
 * Provides the platform-wide layout with role-based sidebar navigation:
 * - Fixed left sidebar on desktop (16rem expanded, 3rem collapsed)
 * - Bottom sheet navigation on mobile
 * - Dynamically renders appropriate sidebar based on user role
 * - Hides sidebar on CRM routes (CRM has its own layout)
 * - Only shows sidebar when user is authenticated
 * - Accessibility: Landmark roles, ARIA labels, keyboard navigation support
 *
 * Keyboard Shortcuts:
 * - Cmd/Ctrl + B: Toggle sidebar
 *
 * Usage: Wrap main app content with this layout in App.tsx
 */

interface PlatformLayoutProps {
  children: ReactNode;
}

/**
 * Inner layout that can access useSidebar() context to adjust
 * main content width based on sidebar expanded/collapsed state.
 */
const PlatformLayoutInner = ({ children, activeProfile }: { children: ReactNode; activeProfile?: string }) => {
  const { state, isMobile } = useSidebar();
  const sidebarWidth = state === 'collapsed' ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)';

  return (
    <>
      <UnifiedSidebar activeProfile={activeProfile} />

      <main
        className="overflow-x-hidden overflow-y-auto bg-background pb-24 md:pb-0 md:ml-auto transition-[width] duration-200 ease-linear"
        style={isMobile ? undefined : { width: `calc(100vw - ${sidebarWidth})` }}
        role="main"
        aria-label="Platform main content"
      >
        {children || <Outlet />}
      </main>

      <PlatformMobileNav />

      {/* ARIA live region for dynamic status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="platform-status-announcements"
      />
    </>
  );
};

export const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const { user, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  // Hide platform sidebar on CRM routes, homepage, and when not authenticated
  // CRM has its own layout, homepage is public marketing page
  const hidesSidebar =
    !user ||
    currentPath === '/' ||
    currentPath.startsWith('/crm') ||
    currentPath === '/susgigs';

  // If sidebar should be hidden, render outlet without sidebar
  if (hidesSidebar) {
    return <>{children || <Outlet />}</>;
  }

  // Show loading state while auth OR profile is loading to prevent sidebar flash
  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-red-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <PlatformLayoutInner activeProfile={activeProfile}>
        {children}
      </PlatformLayoutInner>
    </SidebarProvider>
  );
};
