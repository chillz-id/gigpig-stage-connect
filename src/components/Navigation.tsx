import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Moon, Sun, Menu, X, User, Star, Bell, MessageCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

interface NavigationProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  return (
    <nav className="bg-white/10 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <h1 className="text-2xl font-bold text-white">GigPig</h1>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-white hover:text-pink-300 bg-transparent">
                    Shows
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <NavigationMenuLink asChild>
                        <Link to="/browse" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Browse Shows</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Find comedy opportunities near you
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      {user?.roles.includes('promoter') && (
                        <NavigationMenuLink asChild>
                          <Link to="/create-event" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Create Event</div>
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
                  <NavigationMenuTrigger className="text-white hover:text-pink-300 bg-transparent">
                    Manage
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <NavigationMenuLink asChild>
                        <Link to="/dashboard" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Dashboard</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            View your activity and stats
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      {user?.roles.includes('promoter') && (
                        <NavigationMenuLink asChild>
                          <Link to="/applications" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Applications</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Manage comedian applications
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      )}
                      <NavigationMenuLink asChild>
                        <Link to="/profile" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Profile</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Update your comedian profile
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {user?.roles.includes('promoter') && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-white hover:text-pink-300 bg-transparent">
                      Settings
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-4 w-[400px]">
                        <NavigationMenuLink asChild>
                          <Link to="/promoter-settings" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">Promoter Settings</div>
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

            <Link to="/pricing" className="text-white hover:text-pink-300 transition-colors">
              Pricing
            </Link>
            
            {/* Quick Action Buttons */}
            {user && (
              <div className="flex items-center space-x-2">
                <Link to="/notifications">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 relative">
                    <MessageCircle className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  </Button>
                </Link>
                {user.roles.includes('promoter') && (
                  <Link to="/create-event">
                    <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                      <Plus className="w-4 h-4 mr-1" />
                      Create
                    </Button>
                  </Link>
                )}
              </div>
            )}
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-white" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-purple-500"
              />
              <Moon className="w-4 h-4 text-white" />
            </div>

            {/* User Info or Auth Buttons */}
            {user ? (
              <Link to="/profile" className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-2 transition-colors">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                />
                <div className="text-white">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className="text-xs text-purple-200 border-purple-300">
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
              </Link>
            ) : (
              <>
                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-4">
            {/* User info on mobile */}
            {user && (
              <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
                <div className="text-white">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className="text-xs text-purple-200 border-purple-300">
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            <Link 
              to="/browse" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Browse Shows
            </Link>
            <Link 
              to="/dashboard" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {user?.roles.includes('promoter') && (
              <>
                <Link 
                  to="/create-event" 
                  className="block text-white hover:text-pink-300 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Event
                </Link>
                <Link 
                  to="/applications" 
                  className="block text-white hover:text-pink-300 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Applications
                </Link>
              </>
            )}
            <Link 
              to="/profile" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Profile
            </Link>
            <Link 
              to="/messages" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Messages
            </Link>
            <Link 
              to="/notifications" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notifications
            </Link>
            <Link 
              to="/pricing" 
              className="block text-white hover:text-pink-300 transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <div className="flex items-center space-x-2 py-2">
              <Sun className="w-4 h-4 text-white" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-purple-500"
              />
              <Moon className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Dark Mode</span>
            </div>

            {!user && (
              <div className="space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full text-white border-white/20 hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
