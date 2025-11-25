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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserBranding } from '@/hooks/useUserBranding';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useUpcomingGigs } from '@/hooks/useUpcomingGigs';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { ProfileSwitcher } from './ProfileSwitcher';
import { MENU_ITEMS, SECTION_LABELS, type UserRole, type MenuItem } from '@/config/sidebarMenuItems';
import { useMemo, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const { hasRole, signOut, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const { userApplications } = useEventApplications();
  const { confirmedGigCount } = useUpcomingGigs();
  const { isItemHidden, getItemOrder } = useSidebarPreferences();
  const { activeProfile: activeProfileData } = useActiveProfile();

  // Removed navigation debounce - was causing issues with navigation

  // Count pending confirmations
  const pendingConfirmations = userApplications?.filter(
    (app) => app.status === 'accepted' && !app.availability_confirmed
  ) || [];

  // Determine user's primary role from actual user roles (not activeProfile)
  const primaryRole: UserRole = useMemo(() => {
    // Check actual user roles from auth context (in priority order)
    if (hasRole('admin')) return 'admin';
    if (hasRole('comedian_lite')) return 'comedian_lite';
    if (hasRole('comedian')) return 'comedian';
    if (hasRole('photographer')) return 'photographer';
    if (hasRole('videographer')) return 'videographer';
    if (hasRole('co_promoter')) return 'co_promoter';
    if (hasRole('member')) return 'member';

    // Fallback
    return 'member';
  }, [hasRole]);

  // Check permissions
  const hasAdminAccess = hasRole('admin');
  const hasCRMAccess = hasRole('admin');
  const hasManagerAccess = hasRole('admin');
  const hasAgencyAccess = hasRole('admin');

  const permissions = {
    hasAdminAccess,
    hasCRMAccess,
    hasManagerAccess,
    hasAgencyAccess,
  };

  // Helper function to transform profile paths to use active profile type and slug
  const getItemPath = (path: string): string => {
    // If viewing an organization, transform /dashboard to org-specific dashboard
    if (path === '/dashboard' && activeProfileData?.type === 'organization' && activeProfileData?.slug) {
      return `/org/${activeProfileData.slug}/dashboard`;
    }

    // If viewing an organization, transform /my-events to org-specific events
    if (path === '/my-events' && activeProfileData?.type === 'organization' && activeProfileData?.slug) {
      return `/org/${activeProfileData.slug}/events`;
    }

    // If path starts with /profile, replace with /:type/:slug/edit
    if (path.startsWith('/profile')) {
      // Special case: EPK goes to public profile view, not profile editing page
      const isEPK = path.includes('tab=EPK');

      // Try to use active profile data first
      if (activeProfileData?.type && activeProfileData?.slug) {
        // Map 'organization' to 'org' for shorter URLs
        const urlType = activeProfileData.type === 'organization' ? 'org' : activeProfileData.type;

        if (isEPK) {
          // EPK: /profile?tab=EPK → /:type/:slug?tab=epk (public profile view, index route)
          return path.replace('/profile', `/${urlType}/${activeProfileData.slug}`).replace('tab=EPK', 'tab=epk');
        } else {
          // Other tabs: /profile?tab=X → /:type/:slug/edit?tab=X (profile editing page, nested route)
          return path.replace('/profile', `/${urlType}/${activeProfileData.slug}/edit`);
        }
      }

      // Fallback to auth profile if active profile not set
      const slug = profile?.profile_slug || profile?.id;
      if (slug) {
        if (isEPK) {
          return path.replace('/profile', `/comedian/${slug}`).replace('tab=EPK', 'tab=epk');
        } else {
          return path.replace('/profile', `/comedian/${slug}/edit`);
        }
      }
    }
    return path;
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
      // "My Events" only shows when an organization profile is active
      if (item.id === 'my-events') {
        if (activeProfileData?.type !== 'organization') {
          return false;
        }
      }

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
  }, [primaryRole, hasAdminAccess, permissions, isItemHidden, activeProfileData?.type]);

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
    const transformedPath = getItemPath(path);
    // Handle query params for profile tabs
    if (transformedPath.includes('?tab=')) {
      return location.pathname + location.search === transformedPath;
    }
    return location.pathname === transformedPath || location.pathname.startsWith(transformedPath + '/');
  };

  // Track expanded state for nested items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['profile']));

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Recursively filter children based on role and permissions
  const filterChildren = (children: MenuItem[] | undefined): MenuItem[] => {
    if (!children) return [];

    return children.filter((child) => {
      // Check if user's role is in the allowed roles
      if (!child.roles.includes(primaryRole)) {
        if (!hasAdminAccess) return false;
      }

      // Check if item requires special permissions
      if (child.requiresPermission && !child.requiresPermission(permissions)) {
        return false;
      }

      // Check if item is hidden by user preference
      if (isItemHidden(child.id)) {
        return false;
      }

      return true;
    }).map((child) => ({
      ...child,
      children: filterChildren(child.children),
    }));
  };

  // Render a menu item (with support for nested children)
  const renderMenuItem = (item: MenuItem, depth: number = 0): React.ReactNode => {
    const badge = item.getBadge?.(badgeData);
    const active = isActive(item.path);
    const filteredChildren = filterChildren(item.children);
    const hasChildren = filteredChildren.length > 0;
    const isExpanded = expandedItems.has(item.id);

    // Check if any child is active
    const hasActiveChild = filteredChildren.some((child) =>
      isActive(child.path) || (child.children && child.children.some((c) => isActive(c.path)))
    );

    // External link
    if (item.external) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            tooltip={item.label}
            className="text-gray-100 hover:bg-gray-800"
          >
            <a
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // Item with children
    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                isActive={active || hasActiveChild}
                tooltip={item.label}
                className={
                  active || hasActiveChild
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'text-gray-100 hover:bg-gray-800'
                }
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {badge && (
                      <Badge
                        className={`text-xs ${
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
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {filteredChildren.map((child) => renderNestedItem(child, depth + 1))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Regular item without children
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
          <Link
            to={getItemPath(item.path)}
            className="flex items-center justify-between w-full"
          >
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

  // Render nested menu items
  const renderNestedItem = (item: MenuItem, depth: number): React.ReactNode => {
    const badge = item.getBadge?.(badgeData);
    const active = isActive(item.path);
    const filteredChildren = filterChildren(item.children);
    const hasChildren = filteredChildren.length > 0;
    const isExpanded = expandedItems.has(item.id);

    // Nested item with children
    if (hasChildren) {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <SidebarMenuSubItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton
                isActive={active}
                className={
                  active
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'text-gray-100 hover:bg-gray-800'
                }
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {badge && (
                      <Badge
                        className={`text-xs ${
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
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="ml-4">
                {filteredChildren.map((child) => renderNestedItem(child, depth + 1))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuSubItem>
        </Collapsible>
      );
    }

    // Regular nested item without children
    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          asChild
          isActive={active}
          className={
            active
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'text-gray-100 hover:bg-gray-800'
          }
        >
          <Link to={getItemPath(item.path)} className="flex items-center justify-between w-full">
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
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
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

      <SidebarFooter className="border-t border-gray-800 p-4">
        <Button
          className="professional-button w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
