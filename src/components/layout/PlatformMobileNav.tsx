import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Platform Mobile Navigation
 *
 * Bottom sheet trigger for mobile devices.
 * On mobile, the sidebar is converted to a bottom sheet that slides up when the menu button is clicked.
 * This component provides the trigger button to open the mobile navigation.
 */
export const PlatformMobileNav = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="fixed bottom-4 right-4 z-40 md:hidden">
      <Button
        onClick={toggleSidebar}
        size="lg"
        className="h-14 w-14 rounded-full bg-[#1e2a3d] hover:bg-[#283548] text-white shadow-lg border border-gray-700"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
};
