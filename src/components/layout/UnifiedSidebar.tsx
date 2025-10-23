import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useUserBranding } from '@/hooks/useUserBranding';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useUpcomingGigs } from '@/hooks/useUpcomingGigs';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { ProfileSwitcher } from './ProfileSwitcher';
import { MENU_ITEMS, SECTION_LABELS, type UserRole, type MenuItem } from '@/config/sidebarMenuItems';
import { useMemo } from 'react';

interface UnifiedSidebarProps {
  activeProfile?: string;
}

/**
 * Unified Sidebar Component
 *
 * Single sidebar that adapts to user role and respects customization preferences:
 * - Filters items based on user role and permissions
 * - Applies custom order from user preferences
 * - Hides items based on user preferences
 * - Shows dynamic badges (notifications, pending actions, etc.)
 * - Maintains all existing functionality (collapse, active states, etc.)
 */
export const UnifiedSidebar = ({ activeProfile }: UnifiedSidebarProps) => {
  const location = useLocation();
  const { logoUrl, brandName, isLoading } = useUserBranding();
  const { hasRole } = useAuth();
  const { unreadCount } = useNotifications();
  const { userApplications } = useEventApplications();
  const { confirmedGigCount } = useUpcomingGigs();
  const { isItemHidden, getItemOrder } = useSidebarPreferences();

  // Count pending confirmations
  const pendingConfirmations = userApplications?.filter(
    (app) => app.status === 'accepted' && !app.availability_confirmed
  ) || [];

  // Determine user's primary role from active profile
  const primaryRole: UserRole = useMemo(() => {
    if (activeProfile?.startsWith('org:')) return 'admin';
    return (activeProfile as UserRole) || 'comedian';
  }, [activeProfile]);

  // Check permissions
  const hasAdminAccess = hasRole('admin');
  const hasCRMAccess = hasRole('admin') || hasRole('agency_manager') || hasRole('promoter') || hasRole('venue_manager');
  const hasManagerAccess = hasRole('agency_manager') || hasRole('manager');
  const hasAgencyAccess = hasRole('admin') || hasRole('agency_manager') || hasRole('promoter');

  const permissions = {
    hasAdminAccess,
    hasCRMAccess,
    hasManagerAccess,
    hasAgencyAccess,
  };

  // Badge data
  const badgeData = {
    unreadCount,
    pendingConfirmations: pendingConfirmations.length,
    confirmedGigCount,
  };

  // Filter menu items based on role and permissions
  const availableItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      // Check if user's role is in the allowed roles
      if (!item.roles.includes(primaryRole)) {
        // Special case: if user has admin role, they can see everything
        if (!hasAdminAccess) return false;
      }

      // Check if item requires special permissions
      if (item.requiresPermission && !item.requiresPermission(permissions)) {
        return false;
      }

      // Check if item is hidden by user preference
      if (isItemHidden(item.id)) {
        return false;
      }

      return true;
    });
  }, [primaryRole, hasAdminAccess, permissions, isItemHidden]);

  // Apply custom order from user preferences
  const orderedItems = useMemo(() => {
    const customOrder = getItemOrder();

    if (customOrder.length === 0) {
      return availableItems;
    }

    // Create a map for quick lookup
    const itemMap = new Map(availableItems.map(item => [item.id, item]));

    // First, add items in custom order
    const ordered: MenuItem[] = [];
    customOrder.forEach(id => {
      const item = itemMap.get(id);
      if (item) {
        ordered.push(item);
        itemMap.delete(id); // Remove from map
      }
    });

    // Then add any remaining items that weren't in custom order (new items)
    itemMap.forEach(item => {
      ordered.push(item);
    });

    return ordered;
  }, [availableItems, getItemOrder]);

  // Group items by section
  const itemsBySection = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    const noSection: MenuItem[] = [];

    orderedItems.forEach((item) => {
      if (item.section) {
        if (!grouped[item.section]) {
          grouped[item.section] = [];
        }
        grouped[item.section].push(item);
      } else {
        noSection.push(item);
      }
    });

    return { grouped, noSection };
  }, [orderedItems]);

  // Check if a path is active
  const isActive = (path: string) => {
    // Handle query params for profile tabs
    if (path.includes('?tab=')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Render a menu item
  const renderMenuItem = (item: MenuItem) => {
    const badge = item.getBadge?.(badgeData);
    const active = isActive(item.path);

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.label}
          className={
            active
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'text-gray-100 hover:bg-gray-800'
          }
        >
          <Link to={item.path} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
            {badge && (
              <Badge
                className={`text-xs ml-auto ${
                  badge.variant === 'destructive'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : badge.variant === 'secondary'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {badge.count}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r bg-gray-900/95" collapsible="icon">
      <SidebarHeader className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          {/* Show logo OR name, not both. Logo takes priority if available */}
          {!isLoading && logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName || 'Stand Up Sydney'}
              className="h-10 w-auto max-w-[200px] object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:max-w-[32px]"
            />
          ) : (
            <h2 className="text-lg font-semibold text-gray-100 truncate group-data-[collapsible=icon]:opacity-0">
              {isLoading ? 'Stand Up Sydney' : brandName || 'Stand Up Sydney'}
            </h2>
          )}
          <SidebarTrigger className="text-gray-400 hover:text-gray-100 flex-shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Profile Switcher */}
        <div className="px-2 pt-2 pb-4">
          <ProfileSwitcher />
        </div>

        {/* Items without section (e.g., Dashboard) */}
        {itemsBySection.noSection.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsBySection.noSection.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Render sections in preferred order */}
        {['opportunities', 'work', 'business', 'manager', 'admin', 'account'].map((sectionKey) => {
          const sectionItems = itemsBySection.grouped[sectionKey];
          if (!sectionItems || sectionItems.length === 0) return null;

          return (
            <SidebarGroup key={sectionKey}>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {SECTION_LABELS[sectionKey]}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sectionItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
};
