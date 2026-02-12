import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GoogleCalendarCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = React.useState('Connecting your Google Calendar...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Google Calendar authorization failed: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        // Verify state parameter
        const stateData = JSON.parse(atob(state));
        if (stateData.user_id !== user?.id) {
          throw new Error('Invalid state parameter - please try again');
        }

        setMessage('Exchanging authorization code...');

        // Call our backend function to exchange the code for tokens
        const response = await fetch('/api/google-calendar/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exchange-token',
            event_data: {
              code,
              user_id: user?.id
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to connect Google Calendar');
        }

        const result = await response.json();
        
        if (result.success) {
          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          toast({
            title: "Calendar Connected",
            description: "Your Google Calendar has been successfully connected. Your comedy gigs will now sync automatically.",
          });

          // Redirect to profile after a brief delay
          setTimeout(() => {
            navigate('/profile');
          }, 2000);
        } else {
          throw new Error(result.error || 'Unknown error occurred');
        }

      } catch (error: any) {
        console.error('Google Calendar callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to connect Google Calendar');
        
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect Google Calendar. Please try again.",
          variant: "destructive"
        });

        // Redirect to profile after a delay
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      }
    };

    if (user?.id) {
      handleCallback();
    } else {
      // No user logged in, redirect to auth
      navigate('/auth');
    }
  }, [searchParams, user?.id, navigate, toast]);

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20';
    }
    return 'bg-gray-800/90 border-gray-600';
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
      <div className="container mx-auto px-4 max-w-md">
        <Card className={cn(getCardStyles(), "text-white")}>
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              {status === 'processing' && (
                <Calendar className="w-16 h-16 text-purple-400 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="w-16 h-16 text-green-400" />
              )}
              {status === 'error' && (
                <AlertCircle className="w-16 h-16 text-red-400" />
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold">
              {status === 'processing' && 'Connecting Calendar'}
              {status === 'success' && 'Calendar Connected!'}
              {status === 'error' && 'Connection Failed'}
            </h1>

            {/* Message */}
            <p className="text-gray-300">
              {message}
            </p>

            {/* Additional info */}
            {status === 'success' && (
              <div className="text-sm text-gray-400 bg-green-900/20 p-3 rounded">
                <p>✓ Your comedy gigs will now automatically sync to Google Calendar</p>
                <p>✓ You can manage this connection from your profile settings</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-sm text-gray-400 bg-red-900/20 p-3 rounded">
                <p>You can try connecting again from your profile page.</p>
              </div>
            )}

            {/* Loading indicator */}
            {status === 'processing' && (
              <div className="text-sm text-gray-400">
                This may take a few moments...
              </div>
            )}

            {/* Auto-redirect message */}
            {status !== 'processing' && (
              <div className="text-xs text-gray-500">
                Redirecting to your profile in a few seconds...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;