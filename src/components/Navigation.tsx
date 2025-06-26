import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Moon, Sun, Menu, X, User, Star, Bell, MessageCircle, Plus } from 'lucide-react';
import { PigIcon } from '@/components/ui/pig-icon';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import CustomerViewToggle from './CustomerViewToggle';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const togglePigMode = () => {
    setTheme(theme === 'pig' ? 'light' : 'pig');
  };

  // Helper function to check if user has a specific role
  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo with Customer View Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-primary-foreground font-bold text-lg">GP</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">GigPig</h1>
            </Link>
            
            <CustomerViewToggle />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
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
                      {hasRole('promoter') && (
                        <NavigationMenuLink asChild>
                          <Link to="/create-event" className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:shadow-md">
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
                      {hasRole('promoter') && (
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
                            Update your comedian profile
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {hasRole('promoter') && (
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

            {/* Conditional Pricing/Upgrade Link */}
            {user ? (
              <Link to="/profile?tab=settings" className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
                Upgrade
              </Link>
            ) : (
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors duration-200 font-medium">
                Pricing
              </Link>
            )}
            
            {/* Quick Action Buttons */}
            {user && (
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
                {hasRole('promoter') && (
                  <Link to="/create-event">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Event
                    </Button>
                  </Link>
                )}
              </div>
            )}
            
            {/* Theme Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1">
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleDarkMode}
                  className="data-[state=checked]:bg-primary"
                />
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePigMode}
                className={`w-10 h-10 p-0 rounded-lg transition-all duration-200 ${theme === 'pig' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <PigIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* User Info or Auth Buttons */}
            {user ? (
              <Link to="/profile" className="flex items-center space-x-3 hover:bg-accent rounded-xl p-3 transition-all duration-200 group">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-border group-hover:border-primary transition-colors duration-200"
                />
                <div className="text-foreground">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                    {user.membership?.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/auth">
                  <Button variant="outline" className="text-foreground border-border hover:bg-accent transition-all duration-200 rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-6 space-y-4 text-foreground animate-fade-in bg-background/95 backdrop-blur-lg border-t border-border">
            {/* User info on mobile */}
            {user && (
              <div className="flex items-center space-x-3 pb-4 border-b border-border">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-border"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                    {user.membership?.toUpperCase() || 'FREE'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Mobile navigation links */}
            {[
              { to: '/browse', label: 'Browse Shows' },
              { to: '/dashboard', label: 'Dashboard' },
              ...(hasRole('promoter') ? [
                { to: '/create-event', label: 'Create Event' },
                { to: '/applications', label: 'Applications' },
                { to: '/invoices', label: 'Invoices' }
              ] : []),
              { to: '/profile', label: 'Profile' },
              { to: '/messages', label: 'Messages' },
              { to: '/notifications', label: 'Notifications' },
              ...(user ? [{ to: '/profile?tab=settings', label: 'Upgrade' }] : [{ to: '/pricing', label: 'Pricing' }])
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-foreground hover:text-primary transition-colors duration-200 py-2 px-1 rounded-lg hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex items-center justify-between py-3 px-1">
              <div className="flex items-center space-x-3">
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleDarkMode}
                  className="data-[state=checked]:bg-primary"
                />
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePigMode}
                className={`p-2 rounded-lg ${theme === 'pig' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <PigIcon className="w-4 h-4" />
              </Button>
            </div>

            {!user && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Link to="/auth">
                  <Button
                    variant="outline"
                    className="w-full text-foreground border-border hover:bg-accent transition-all duration-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export { Navigation };
export default Navigation;
