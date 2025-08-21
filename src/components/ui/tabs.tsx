
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  
  const getThemeStyles = () => {
    if (theme === 'pleasure') {
      return "bg-purple-900/80 border border-purple-600/30";
    }
    return "bg-gray-800/90 border border-gray-600/40";
  };

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-xl p-1 text-muted-foreground shadow-lg",
        getThemeStyles(),
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme();
  
  const getThemeStyles = () => {
    if (theme === 'pleasure') {
      return "data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-700/50 text-purple-200";
    }
    return "data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-700/50 text-gray-300";
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        getThemeStyles(),
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
