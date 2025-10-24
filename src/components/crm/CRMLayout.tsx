import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CRMSidebar } from './CRMSidebar';
import { CRMMobileNav } from './CRMMobileNav';

/**
 * CRM Layout Component
 *
 * Provides the desktop-first layout for the CRM interface with:
 * - Fixed left sidebar (16rem expanded, 3rem collapsed)
 * - Main content area with routing outlet
 * - Responsive behavior (converts to bottom sheet on mobile)
 * - Accessibility: Landmark roles, ARIA labels, keyboard navigation support
 *
 * Keyboard Shortcuts:
 * - Cmd/Ctrl + B: Toggle sidebar
 *
 * Usage: Wrap CRM routes with this layout in App.tsx
 */
export const CRMLayout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <CRMSidebar />
        <main
          className="flex-1 overflow-y-auto bg-background pb-24 lg:pb-0"
          role="main"
          aria-label="CRM main content"
        >
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <Outlet />
          </div>
        </main>
        <CRMMobileNav />
      </div>
      {/* ARIA live region for dynamic status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="crm-status-announcements"
      />
    </SidebarProvider>
  );
};
