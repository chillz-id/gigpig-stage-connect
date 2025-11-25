
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 md:h-10 md:px-4",
        sm: "h-8 rounded-lg px-3 text-xs md:h-8",
        lg: "h-12 rounded-2xl px-8 text-base md:h-12",
        icon: "h-10 w-10 md:h-10 md:w-10",
        mobile: "h-11 px-4 py-2 md:h-10", // 44px minimum for touch targets
        mobileIcon: "h-12 w-12 md:h-10 md:w-10", // 48px icon buttons on mobile
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // DESIGN SYSTEM ENFORCEMENT: Map 'outline' to 'secondary'
    // Per platform design guidelines: No white button outlines anywhere
    // See: /docs/Platform Performance & UI Consistency.md
    let enforcedVariant = variant;
    if (variant === 'outline') {
      console.warn(
        '[Button] variant="outline" is deprecated and has been automatically converted to variant="secondary". ' +
        'Please update your code to use variant="secondary" or variant="ghost" instead. ' +
        'See /docs/Platform Performance & UI Consistency.md for details.'
      );
      enforcedVariant = 'secondary';
    }

    // Provide fallback theme when context is not available
    let theme = 'business';
    try {
      const themeContext = useTheme();
      theme = themeContext.theme;
    } catch (error) {
      // useTheme throws error when not within ThemeProvider
      console.warn('Button component used outside ThemeProvider, using default theme');
    }

    const Comp = asChild ? Slot : "button"
    
    const getThemeStyles = (currentVariant: string | null | undefined) => {
      if (theme === 'pleasure') {
        switch (currentVariant) {
          case 'default':
            return "bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-900/25 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105";
          case 'outline':
            return "bg-transparent hover:bg-purple-700/80 text-white border-2 border-purple-400 hover:border-purple-300 shadow-md shadow-purple-900/15";
          case 'ghost':
            return "hover:bg-purple-700/60 text-white border-0 hover:shadow-md hover:shadow-purple-900/15";
          case 'secondary':
            return "bg-purple-700/80 text-white hover:bg-purple-600/80 border-0 shadow-md shadow-purple-900/20";
          case 'destructive':
            return "bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-900/25";
          default:
            return "";
        }
      } else {
        switch (currentVariant) {
          case 'default':
            return "bg-gray-700 hover:bg-gray-600 text-white border-0 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/30 hover:scale-105";
          case 'outline':
            return "bg-transparent hover:bg-gray-700/80 text-gray-100 border-2 border-gray-500 hover:border-gray-400 shadow-md shadow-black/20";
          case 'ghost':
            return "hover:bg-gray-700/60 text-gray-100 border-0 hover:shadow-md hover:shadow-black/15";
          case 'secondary':
            return "bg-gray-800/80 text-gray-100 hover:bg-gray-700/80 border-0 shadow-md shadow-black/20";
          case 'destructive':
            return "bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-900/25";
          default:
            return "";
        }
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant: enforcedVariant, size }),
          getThemeStyles(enforcedVariant),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
