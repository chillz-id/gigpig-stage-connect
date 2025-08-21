import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  Send
} from 'lucide-react';

export const Footer = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      // TODO: Implement newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
      });
      setEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const getBackgroundClass = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-t from-purple-900 via-purple-800 to-purple-700';
    }
    return 'bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700';
  };

  const getTextClass = () => {
    return theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300';
  };

  const getAccentClass = () => {
    return theme === 'pleasure' ? 'text-purple-300' : 'text-red-400';
  };

  const getBorderClass = () => {
    return theme === 'pleasure' ? 'border-purple-600/30' : 'border-gray-600/30';
  };

  const getHoverClass = () => {
    return theme === 'pleasure' ? 'hover:text-purple-300' : 'hover:text-red-400';
  };

  return (
    <footer className={cn(
      "relative mt-16 border-t",
      getBackgroundClass(),
      getBorderClass()
    )}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/id-logo.png" 
                alt="Stand Up Sydney" 
                className="h-8 w-auto"
              />
              <h3 className="text-xl font-bold text-white">Stand Up Sydney</h3>
            </div>
            <p className={cn("text-sm leading-relaxed", getTextClass())}>
              Australia's premier comedy platform connecting comedians, promoters, and audiences. 
              Discover amazing shows, connect with talent, and be part of the comedy community.
            </p>
            <div className="flex space-x-4">
              <div className={cn("flex items-center space-x-2 text-sm", getTextClass())}>
                <MapPin className="w-4 h-4" />
                <span>Sydney, Australia</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-4">
            <h4 className={cn("text-lg font-semibold", getAccentClass())}>Quick Links</h4>
            <nav className="space-y-2">
              <Link to="/shows" className={cn("block text-sm transition-colors", getTextClass(), getHoverClass())}>
                Browse Shows
              </Link>
              <Link to="/comedians" className={cn("block text-sm transition-colors", getTextClass(), getHoverClass())}>
                Find Comedians
              </Link>
              <Link to="/photographers" className={cn("block text-sm transition-colors", getTextClass(), getHoverClass())}>
                Photographers
              </Link>
              <Link to="/create-event" className={cn("block text-sm transition-colors", getTextClass(), getHoverClass())}>
                Create Event
              </Link>
              <Link to="/dashboard" className={cn("block text-sm transition-colors", getTextClass(), getHoverClass())}>
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className={cn("text-lg font-semibold", getAccentClass())}>Get In Touch</h4>
            <div className="space-y-3">
              <div className={cn("flex items-center space-x-3 text-sm", getTextClass())}>
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:hello@standupsydney.com" className={cn("transition-colors", getHoverClass())}>
                  hello@standupsydney.com
                </a>
              </div>
              <div className={cn("flex items-center space-x-3 text-sm", getTextClass())}>
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+61234567890" className={cn("transition-colors", getHoverClass())}>
                  +61 2 3456 7890
                </a>
              </div>
              <div className={cn("text-sm", getTextClass())}>
                <p className="font-medium mb-1">Business Inquiries:</p>
                <a href="mailto:business@standupsydney.com" className={cn("transition-colors", getHoverClass())}>
                  business@standupsydney.com
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h4 className={cn("text-lg font-semibold", getAccentClass())}>Stay Updated</h4>
            <p className={cn("text-sm", getTextClass())}>
              Get the latest comedy shows and events delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/60"
                disabled={isSubscribing}
              />
              <Button
                type="submit"
                disabled={isSubscribing || !email}
                className={cn(
                  "w-full transition-all duration-200",
                  theme === 'pleasure' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {isSubscribing ? (
                  'Subscribing...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Social Media & Legal Links */}
        <div className={cn("mt-8 pt-8 border-t", getBorderClass())}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Social Media */}
            <div className="flex items-center space-x-4">
              <span className={cn("text-sm font-medium", getTextClass())}>Follow Us:</span>
              <div className="flex space-x-3">
                <a
                  href="https://facebook.com/standupsydney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("transition-colors", getTextClass(), getHoverClass())}
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/standupsydney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("transition-colors", getTextClass(), getHoverClass())}
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/standupsydney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("transition-colors", getTextClass(), getHoverClass())}
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://youtube.com/@standupsydney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("transition-colors", getTextClass(), getHoverClass())}
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className={cn("text-sm transition-colors", getTextClass(), getHoverClass())}>
                Privacy Policy
              </Link>
              <Link to="/terms" className={cn("text-sm transition-colors", getTextClass(), getHoverClass())}>
                Terms of Service
              </Link>
              <Link to="/cookies" className={cn("text-sm transition-colors", getTextClass(), getHoverClass())}>
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={cn("mt-8 pt-8 border-t text-center", getBorderClass())}>
          <p className={cn("text-sm flex items-center justify-center", getTextClass())}>
            © 2025 Stand Up Sydney. Made with 
            <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
            for the comedy community.
          </p>
        </div>
      </div>
    </footer>
  );
};