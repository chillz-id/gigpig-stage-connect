
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavigationProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link to="/browse" className="text-white hover:text-pink-300 transition-colors">
              Browse Shows
            </Link>
            <Link to="/dashboard" className="text-white hover:text-pink-300 transition-colors">
              Dashboard
            </Link>
            <Link to="/pricing" className="text-white hover:text-pink-300 transition-colors">
              Pricing
            </Link>
            
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

            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              Get Started
            </Button>
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
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
