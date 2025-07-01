
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 backdrop-blur-sm",
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
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
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
    const { theme } = useTheme();
    const Comp = asChild ? Slot : "button"
    
    const getThemeStyles = (currentVariant: string | null | undefined) => {
      if (theme === 'pleasure') {
        switch (currentVariant) {
          case 'default':
            return "bg-white/[0.12] hover:bg-white/[0.18] text-white border border-white/[0.15] shadow-lg shadow-purple-900/25 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105";
          case 'outline':
            return "bg-white/[0.06] hover:bg-white/[0.12] text-white border-2 border-white/[0.25] hover:border-white/[0.35] shadow-md shadow-purple-900/15";
          case 'ghost':
            return "hover:bg-white/[0.08] text-white border-0 hover:shadow-md hover:shadow-purple-900/15";
          case 'secondary':
            return "bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/[0.12] shadow-md shadow-purple-900/20";
          case 'destructive':
            return "bg-red-600/90 hover:bg-red-500/90 text-white border border-red-400/30 shadow-lg shadow-red-900/25 backdrop-blur-sm";
          default:
            return "";
        }
      } else {
        switch (currentVariant) {
          case 'default':
            return "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/30 hover:scale-105";
          case 'outline':
            return "bg-white/[0.04] hover:bg-white/[0.08] text-gray-100 border-2 border-white/[0.20] hover:border-white/[0.30] shadow-md shadow-black/20";
          case 'ghost':
            return "hover:bg-white/[0.06] text-gray-100 border-0 hover:shadow-md hover:shadow-black/15";
          case 'secondary':
            return "bg-white/[0.06] text-gray-100 hover:bg-white/[0.10] border border-white/[0.10] shadow-md shadow-black/20";
          case 'destructive':
            return "bg-red-600/90 hover:bg-red-500/90 text-white border border-red-400/30 shadow-lg shadow-red-900/25 backdrop-blur-sm";
          default:
            return "";
        }
      }
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          getThemeStyles(variant),
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
