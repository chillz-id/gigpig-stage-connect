
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { CreateEventForm } from '@/components/CreateEventForm';
import { CreateEventFormMobile } from '@/components/CreateEventFormMobile';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { cn } from '@/lib/utils';

const CreateEvent = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useMobileLayout();

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20 text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  // Only require authentication - no role restrictions
  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Authentication Required</h1>
            <p className={cn("mb-4 text-sm sm:text-base", theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300')}>
              Please log in to create events.
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className={cn(
            "font-bold text-white mb-2",
            isMobile ? "text-xl" : "text-2xl sm:text-3xl"
          )}>
            Create New Event
          </h1>
          <p className={cn(
            "text-sm sm:text-base",
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            {isMobile ? 'Step-by-step event creation' : 'Build your shows and start receiving applications'}
          </p>
        </div>

        {isMobile ? <CreateEventFormMobile /> : <CreateEventForm />}
      </div>
    </div>
  );
};

export default CreateEvent;
