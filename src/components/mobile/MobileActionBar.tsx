import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MobileActionBarAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface MobileActionBarProps {
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  secondaryActions?: MobileActionBarAction[];
  className?: string;
}

/**
 * Mobile floating action bar
 *
 * Features:
 * - Primary floating action button (FAB)
 * - Optional secondary actions (dropdown menu)
 * - Fixed positioning (bottom-right)
 * - Large touch target (56px)
 * - Safe area support for iOS
 *
 * @example
 * ```tsx
 * <MobileActionBar
 *   primaryAction={{
 *     label: "Create Event",
 *     icon: Plus,
 *     onClick: () => navigate("/create-event")
 *   }}
 *   secondaryActions={[
 *     {
 *       id: "import",
 *       label: "Import Event",
 *       icon: Upload,
 *       onClick: () => handleImport()
 *     }
 *   ]}
 * />
 * ```
 */
export function MobileActionBar({
  primaryAction,
  secondaryActions = [],
  className,
}: MobileActionBarProps) {
  if (!primaryAction && secondaryActions.length === 0) {
    return null;
  }

  const PrimaryIcon = primaryAction?.icon ?? Plus;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-40 md:hidden", // Above bottom nav (64px + 16px margin)
        "pb-safe", // iOS safe area
        className
      )}
    >
      {secondaryActions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              aria-label={primaryAction?.label ?? "Actions"}
            >
              <PrimaryIcon className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            sideOffset={8}
          >
            {primaryAction && (
              <DropdownMenuItem
                onClick={primaryAction.onClick}
                className="flex items-center gap-2 py-3"
              >
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
                <span className="font-medium">{primaryAction.label}</span>
              </DropdownMenuItem>
            )}
            {secondaryActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.onClick}
                className="flex items-center gap-2 py-3"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : primaryAction ? (
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={primaryAction.onClick}
          aria-label={primaryAction.label}
        >
          <PrimaryIcon className="h-6 w-6" />
        </Button>
      ) : null}
    </div>
  );
}
