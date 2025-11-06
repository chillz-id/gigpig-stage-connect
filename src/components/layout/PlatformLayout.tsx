import { ReactNode } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
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

export const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const { activeProfile } = useProfile();
  const { user } = useAuth();
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

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <UnifiedSidebar activeProfile={activeProfile} />

        <main
          className="flex-1 overflow-y-auto bg-background pb-24 lg:pb-0"
          role="main"
          aria-label="Platform main content"
        >
          {children || <Outlet />}
        </main>

        <PlatformMobileNav />
      </div>

      {/* ARIA live region for dynamic status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="platform-status-announcements"
      />
    </SidebarProvider>
  );
};
