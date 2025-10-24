import { Link, useLocation } from 'react-router-dom';
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
import { CRM_BASE_PATH, CRM_NAV_SECTIONS, type CRMNavItem } from '@/config/crmSidebar';
import { ProfileSwitcher } from '@/components/layout/ProfileSwitcher';

const buildMatches = (item: CRMNavItem): string[] => {
  const candidates = [item.path, ...(item.matchPaths ?? [])];
  return candidates.map((segment) =>
    segment.startsWith('/') ? segment : `${CRM_BASE_PATH}/${segment}`
  );
};

const isItemActive = (pathname: string, item: CRMNavItem) => {
  return buildMatches(item).some((target) =>
    pathname === target || pathname.startsWith(`${target}/`)
  );
};

export const CRMSidebar = () => {
  const location = useLocation();
  const { logoUrl, brandName, isLoading } = useUserBranding();

  return (
    <Sidebar className="border-r bg-gray-900/95" collapsible="icon">
      <SidebarHeader className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          {!isLoading && logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName || 'CRM'}
              className="h-10 w-auto max-w-[200px] object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:max-w-[32px]"
            />
          ) : (
            <h2 className="text-lg font-semibold text-gray-100 truncate group-data-[collapsible=icon]:opacity-0">
              {isLoading ? 'CRM' : brandName || 'CRM'}
            </h2>
          )}
          <SidebarTrigger className="flex-shrink-0 text-gray-400 hover:text-gray-100" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Profile Switcher */}
        <div className="px-2 pt-2 pb-4">
          <ProfileSwitcher />
        </div>

        {CRM_NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const href = item.path.startsWith('/') ? item.path : `${CRM_BASE_PATH}/${item.path}`;
                  const active = isItemActive(location.pathname, item);
                  const ItemIcon = item.icon;
                  const baseClasses = 'text-gray-100 hover:bg-gray-800';
                  const activeClasses = 'bg-purple-600 text-white hover:bg-purple-700';

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        isActive={active}
                        className={active ? activeClasses : baseClasses}
                      >
                        <Link to={href}>
                          <ItemIcon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};
