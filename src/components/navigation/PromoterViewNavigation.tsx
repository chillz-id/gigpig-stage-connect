
import React from 'react';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Link } from 'react-router-dom';

interface PromoterViewNavigationProps {
  hasRole: (role: string) => boolean;
  isComedianView: boolean;
}

const PromoterViewNavigation: React.FC<PromoterViewNavigationProps> = ({ hasRole, isComedianView }) => {
  return (
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
                    <Link to="/profile?tab=invoices" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
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
  );
};

export default PromoterViewNavigation;
