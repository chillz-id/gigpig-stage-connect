
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
    <nav className={`${
      isDarkMode 
        ? 'bg-gray-900/95 border-gray-800' 
        : 'bg-white/95 border-gray-200'
    } backdrop-blur-sm border-b sticky top-0 z-50 transition-colors duration-200`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className={`w-8 h-8 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            } rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>GigPig</h1>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={`${
                    isDarkMode 
                      ? 'text-gray-200 hover:text-white bg-transparent hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-gray-100'
                  } transition-colors`}>
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
                  <NavigationMenuTrigger className={`${
                    isDarkMode 
                      ? 'text-gray-200 hover:text-white bg-transparent hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-gray-100'
                  } transition-colors`}>
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
                    <NavigationMenuTrigger className={`${
                      isDarkMode 
                        ? 'text-gray-200 hover:text-white bg-transparent hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 bg-transparent hover:bg-gray-100'
                    } transition-colors`}>
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

            <Link to="/pricing" className={`${
              isDarkMode 
                ? 'text-gray-200 hover:text-white' 
                : 'text-gray-700 hover:text-gray-900'
            } transition-colors`}>
              Pricing
            </Link>
            
            {/* Quick Action Buttons */}
            {user && (
              <div className="flex items-center space-x-2">
                <Link to="/notifications">
                  <Button variant="ghost" size="sm" className={`${
                    isDarkMode 
                      ? 'text-gray-200 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } relative transition-colors`}>
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className={`${
                    isDarkMode 
                      ? 'text-gray-200 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } relative transition-colors`}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  </Button>
                </Link>
                {user.roles.includes('promoter') && (
                  <Link to="/create-event">
                    <Button size="sm" className={`${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                    } text-white transition-all duration-200`}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create
                    </Button>
                  </Link>
                )}
              </div>
            )}
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Sun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className={`${
                  isDarkMode 
                    ? 'data-[state=checked]:bg-blue-600' 
                    : 'data-[state=checked]:bg-blue-500'
                }`}
              />
              <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>

            {/* User Info or Auth Buttons */}
            {user ? (
              <Link to="/profile" className={`flex items-center space-x-3 ${
                isDarkMode 
                  ? 'hover:bg-gray-800' 
                  : 'hover:bg-gray-100'
              } rounded-lg p-2 transition-colors`}>
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className={`w-8 h-8 rounded-full border-2 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}
                />
                <div className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    isDarkMode 
                      ? 'text-blue-200 border-blue-400' 
                      : 'text-blue-600 border-blue-300'
                  }`}>
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
              </Link>
            ) : (
              <>
                <Button variant="outline" className={`${
                  isDarkMode 
                    ? 'text-white border-gray-600 hover:bg-gray-800' 
                    : 'text-gray-900 border-gray-300 hover:bg-gray-50'
                } transition-colors`}>
                  Sign In
                </Button>
                <Button className={`${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                } text-white transition-all duration-200`}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className={`md:hidden ${
              isDarkMode 
                ? 'text-white hover:bg-gray-800' 
                : 'text-gray-900 hover:bg-gray-100'
            } transition-colors`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden pb-4 space-y-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {/* User info on mobile */}
            {user && (
              <div className={`flex items-center space-x-3 pb-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className={`w-10 h-10 rounded-full border-2 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  }`}
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{user.name}</span>
                    {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    isDarkMode 
                      ? 'text-blue-200 border-blue-400' 
                      : 'text-blue-600 border-blue-300'
                  }`}>
                    {user.membership.toUpperCase()}
                  </Badge>
                </div>
              </div>
            )}

            <Link 
              to="/browse" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Browse Shows
            </Link>
            <Link 
              to="/dashboard" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {user?.roles.includes('promoter') && (
              <>
                <Link 
                  to="/create-event" 
                  className={`block ${
                    isDarkMode 
                      ? 'text-gray-200 hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900'
                  } transition-colors py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Event
                </Link>
                <Link 
                  to="/applications" 
                  className={`block ${
                    isDarkMode 
                      ? 'text-gray-200 hover:text-white' 
                      : 'text-gray-700 hover:text-gray-900'
                  } transition-colors py-2`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Applications
                </Link>
              </>
            )}
            <Link 
              to="/profile" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Profile
            </Link>
            <Link 
              to="/messages" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Messages
            </Link>
            <Link 
              to="/notifications" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notifications
            </Link>
            <Link 
              to="/pricing" 
              className={`block ${
                isDarkMode 
                  ? 'text-gray-200 hover:text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              } transition-colors py-2`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <div className="flex items-center space-x-2 py-2">
              <Sun className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className={`${
                  isDarkMode 
                    ? 'data-[state=checked]:bg-blue-600' 
                    : 'data-[state=checked]:bg-blue-500'
                }`}
              />
              <Moon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
              <span className="text-sm">Dark Mode</span>
            </div>

            {!user && (
              <div className="space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  className={`w-full ${
                    isDarkMode 
                      ? 'text-white border-gray-600 hover:bg-gray-800' 
                      : 'text-gray-900 border-gray-300 hover:bg-gray-50'
                  } transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
                <Button 
                  className={`w-full ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                  } text-white transition-all duration-200`}
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
