
import React from 'react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { User, Bell, MessageCircle, Plus, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const DesktopNavigation: React.FC = () => {
  const { user } = useUser();
  const { isMemberView, isComedianView } = useViewMode();

  // Helper function to check if user has a specific role
  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <div className="hidden md:flex items-center space-x-8">
      {/* Member View Navigation */}
      {isMemberView && (
        <div className="flex items-center space-x-6">
          <Link 
            to="/browse" 
            className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
          >
            Shows
          </Link>
          <Link 
            to="/comedians" 
            className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
          >
            Comedians
          </Link>
          <Link 
            to="/profile?tab=calendar" 
            className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Link>
          <Link to={user ? "/profile?tab=book-comedian" : "/auth"}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
              <User className="w-4 h-4 mr-2" />
              Book Comedian
            </Button>
          </Link>
        </div>
      )}

      {/* Non-Member View Navigation */}
      {!isMemberView && (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium">
                Shows
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 w-[500px] bg-background/95 backdrop-blur-lg border border-border shadow-xl rounded-lg">
                  <NavigationMenuLink asChild>
                    <Link to="/browse" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                      <div className="text-sm font-semibold leading-none">Browse Shows</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Find comedy opportunities near you
                      </p>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link to="/comedians" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                      <div className="text-sm font-semibold leading-none">Comedians</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Browse Stand Up Sydney comedians
                      </p>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link to="/profile?tab=calendar" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                      <div className="text-sm font-semibold leading-none">Calendar</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        View calendar of upcoming shows
                      </p>
                    </Link>
                  </NavigationMenuLink>
                  {/* Only show Create Event for actual promoters/admins, not comedians */}
                  {(hasRole('promoter') || hasRole('admin')) && !isComedianView && (
                    <NavigationMenuLink asChild>
                      <Link to="/create-event" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                        <div className="text-sm font-semibold leading-none">Create Event</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Set up your comedy show
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium">
                Manage
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 w-[500px] bg-background/95 backdrop-blur-lg border border-border shadow-xl rounded-lg">
                  <NavigationMenuLink asChild>
                    <Link to="/dashboard" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                      <div className="text-sm font-semibold leading-none">Dashboard</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        View your activity and stats
                      </p>
                    </Link>
                  </NavigationMenuLink>
                  {/* Only show promoter features for actual promoters/admins, not comedian view */}
                  {(hasRole('promoter') || hasRole('admin')) && !isComedianView && (
                    <>
                      <NavigationMenuLink asChild>
                        <Link to="/applications" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                          <div className="text-sm font-semibold leading-none">Applications</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Manage comedian applications
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link to="/invoices" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                          <div className="text-sm font-semibold leading-none">Invoices</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Create and manage invoices
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </>
                  )}
                  <NavigationMenuLink asChild>
                    <Link to="/profile" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                      <div className="text-sm font-semibold leading-none">Profile</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Update your profile
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Hide Settings for comedian view */}
            {(hasRole('promoter') || hasRole('admin')) && !isComedianView && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium">
                  Settings
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] bg-background/95 backdrop-blur-lg border border-border shadow-xl rounded-lg">
                    <NavigationMenuLink asChild>
                      <Link to="/promoter-settings" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
                        <div className="text-sm font-semibold leading-none">Promoter Settings</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Customize branding and manage staff groups
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      )}
      
      {/* Quick Action Buttons - hide for Member view and hide Create Event for comedian view */}
      {user && !isMemberView && (
        <div className="flex items-center space-x-3">
          <Link to="/notifications">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </Button>
          </Link>
          {/* Hide Create Event for comedian view */}
          {(hasRole('promoter') || hasRole('admin')) && !isComedianView && (
            <Link to="/create-event">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Event
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default DesktopNavigation;
