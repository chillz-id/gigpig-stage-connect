import { Home, Calendar, Briefcase, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface MobileBottomNavProps {
  onMoreClick?: () => void;
  notificationCounts?: {
    applications?: number;
  };
}

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    id: "shows",
    label: "Shows",
    icon: Calendar,
    href: "/shows",
  },
  {
    id: "applications",
    label: "Applications",
    icon: Briefcase,
    href: "/applications",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    href: "/profile",
  },
];

/**
 * Mobile bottom navigation bar
 *
 * Features:
 * - 5 primary navigation items (4 links + More drawer)
 * - Active state indicators
 * - Badge support for notifications
 * - Fixed positioning with safe area support
 * - 60px height for comfortable thumb reach
 *
 * @example
 * ```tsx
 * <MobileBottomNav
 *   onMoreClick={() => setDrawerOpen(true)}
 *   notificationCounts={{ applications: 3 }}
 * />
 * ```
 */
export function MobileBottomNav({
  onMoreClick,
  notificationCounts = {},
}: MobileBottomNavProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background",
        "md:hidden", // Only show on mobile
        "pb-safe" // iOS safe area padding
      )}
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasNotification = item.id === "applications" && (notificationCounts.applications ?? 0) > 0;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-colors",
                "active:bg-accent", // Touch feedback
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", active && "fill-current")} />
                {hasNotification && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-2 h-5 min-w-[20px] px-1 text-[10px]"
                  >
                    {notificationCounts.applications}
                  </Badge>
                )}
              </div>
              <span className="truncate text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={onMoreClick}
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-colors",
            "active:bg-accent text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="h-6 w-6" />
          <span className="truncate text-xs font-medium">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
