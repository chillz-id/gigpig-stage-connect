
import * as React from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const { theme } = useTheme();
    
    const getThemeStyles = () => {
      if (theme === 'pleasure') {
        return "bg-white/[0.08] border-0 backdrop-blur-md text-white placeholder:text-white/50 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/20 shadow-lg shadow-black/10";
      }
      return "bg-gray-800/60 border-0 backdrop-blur-md text-gray-100 placeholder:text-gray-400 focus:bg-gray-700/60 focus:ring-2 focus:ring-gray-500/40 shadow-lg shadow-black/20";
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
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
