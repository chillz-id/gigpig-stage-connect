import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
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

/**
 * Inner layout that can access useSidebar() context to adjust
 * main content width based on sidebar expanded/collapsed state.
 */
const CRMLayoutInner = () => {
  const { state, isMobile } = useSidebar();
  const sidebarWidth = state === 'collapsed'
    ? 'calc(var(--sidebar-width-icon) + 4rem)'
    : 'var(--sidebar-width)';

  return (
    <>
      <CRMSidebar />
      <main
        className="overflow-x-hidden overflow-y-auto bg-background pb-24 md:pb-0"
        style={isMobile ? { width: '100%' } : {
          width: `calc(100% - ${sidebarWidth})`,
          marginLeft: 'auto'
        }}
        role="main"
        aria-label="CRM main content"
      >
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <Outlet />
        </div>
      </main>
      <CRMMobileNav />
      {/* ARIA live region for dynamic status updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="crm-status-announcements"
      />
    </>
  );
};

export const CRMLayout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <CRMLayoutInner />
    </SidebarProvider>
  );
};
