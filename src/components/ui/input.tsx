
import * as React from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const { theme } = useTheme();
    
    const getThemeStyles = () => {
      if (theme === 'pleasure') {
        return "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder:text-white/60 focus:border-pink-400 focus:ring-pink-400/20";
      }
      return "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/20";
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          getThemeStyles(),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
