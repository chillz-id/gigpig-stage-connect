import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

/**
 * Mobile drawer component for filters, settings, and secondary navigation
 *
 * Features:
 * - Slide-in from any side (default: left)
 * - Backdrop blur
 * - Swipe-to-close gesture (handled by Sheet component)
 * - Smooth animations
 * - Accessible (keyboard navigation, focus trap)
 *
 * @example
 * ```tsx
 * <MobileDrawer
 *   open={drawerOpen}
 *   onOpenChange={setDrawerOpen}
 *   title="More Options"
 * >
 *   <nav className="space-y-2">
 *     <Link to="/settings">Settings</Link>
 *     <Link to="/help">Help</Link>
 *   </nav>
 * </MobileDrawer>
 * ```
 */
export function MobileDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "left",
  className,
}: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex flex-col p-0 md:hidden", // Only show on mobile
          "w-[85vw] max-w-sm", // 85% of viewport width, max 384px
          className
        )}
      >
        {(title || description) && (
          <SheetHeader className="border-b px-6 py-4">
            {title && (
              <SheetTitle className="text-left">{title}</SheetTitle>
            )}
            {description && (
              <SheetDescription className="text-left">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 h-8 w-8 rounded-full"
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" />
        </Button>
      </SheetContent>
    </Sheet>
  );
}
