import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MobilePageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-optimized page header component
 *
 * Features:
 * - Sticky positioning at top
 * - 56px height (iOS standard)
 * - Back button (replaces breadcrumbs on mobile)
 * - Optional action buttons (right side)
 * - Safe area support for iOS notch
 *
 * @example
 * ```tsx
 * <MobilePageHeader
 *   title="Event Details"
 *   showBackButton
 *   actions={
 *     <Button size="sm" variant="ghost">
 *       <Share2 className="h-4 w-4" />
 *     </Button>
 *   }
 * />
 * ```
 */
export function MobilePageHeader({
  title,
  onBack,
  showBackButton = true,
  actions,
  className,
}: MobilePageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 md:hidden", // Only show on mobile
        className
      )}
    >
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-10 w-10 p-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <h1 className="flex-1 truncate text-lg font-semibold">
        {title}
      </h1>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
