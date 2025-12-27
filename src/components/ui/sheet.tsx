import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X, GripHorizontal } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { useMobileLayout } from "@/hooks/useMobileLayout"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    /** Enable backdrop blur effect */
    blur?: boolean;
  }
>(({ className, blur = false, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      blur && "backdrop-blur-sm",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> {
  /** Hide the default close button (useful when content has its own close button) */
  hideCloseButton?: boolean;
  /** Show drag handle indicator for bottom sheets (mobile) */
  showDragHandle?: boolean;
  /** Enable backdrop blur */
  backdropBlur?: boolean;
  /** Max height for bottom sheet (only applies to side="bottom") */
  maxHeight?: string;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({
  side = "right",
  className,
  children,
  hideCloseButton = false,
  showDragHandle,
  backdropBlur = false,
  maxHeight = "90vh",
  ...props
}, ref) => {
  const { isMobile } = useMobileLayout()

  // Auto-show drag handle on mobile bottom sheets
  const shouldShowDragHandle = showDragHandle ?? (isMobile && side === "bottom")

  // Close button sizing - larger on mobile for 44px touch target
  const closeButtonClasses = cn(
    "absolute rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
    isMobile
      ? "right-3 top-3 p-2 -m-2 touch-target-44" // Larger touch target on mobile
      : "right-4 top-4"
  )

  return (
    <SheetPortal>
      <SheetOverlay blur={backdropBlur || (isMobile && side === "bottom")} />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          sheetVariants({ side }),
          // Padding: adjust for mobile
          isMobile ? "p-4" : "p-6",
          // Max height for bottom sheets
          side === "bottom" && `max-h-[${maxHeight}] overflow-y-auto`,
          // Safe area padding for iOS home indicator
          side === "bottom" && "pb-safe",
          className
        )}
        style={side === "bottom" ? { maxHeight } : undefined}
        {...props}
      >
        {/* Drag handle for bottom sheets on mobile */}
        {shouldShowDragHandle && (
          <div className="flex justify-center pt-1 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
          </div>
        )}
        {children}
        {!hideCloseButton && (
          <SheetPrimitive.Close className={closeButtonClasses}>
            <X className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}

