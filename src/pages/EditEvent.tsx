import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvent } from '@/hooks/data/useEvents';
import { EditEventForm } from '@/components/EditEventForm';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// hasRole is available from useAuth hook

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { event, isLoading } = useEvent(id);

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20 text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  // Check if user is authorized to edit
  const canEdit = user && event && (
    event.promoter_id === user.id || 
    event.co_promoter_ids?.includes(user.id) ||
    hasRole(user, 'admin')
  );

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Authentication Required</h1>
            <p className={cn("mb-4 text-sm sm:text-base", theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300')}>
              Please log in to edit events.
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

  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", getBackgroundStyles())}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Event Not Found</h1>
            <p className={cn("mb-4 text-sm sm:text-base", theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300')}>
              The event you're looking for doesn't exist.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", getBackgroundStyles())}>
        <Card className={cn("max-w-md w-full", getCardStyles())}>
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Unauthorized</h1>
            <p className={cn("mb-4 text-sm sm:text-base", theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300')}>
              You don't have permission to edit this event.
            </p>
            <Button 
              onClick={() => navigate(`/events/${id}`)} 
              className="w-full"
            >
              View Event
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <Card className={cn("mx-auto", getCardStyles())}>
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <h1 className={cn(
              "text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8",
              theme === 'pleasure' ? 'text-white' : 'text-gray-100'
            )}>
              Edit Event
            </h1>
            <EditEventForm event={event} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditEvent;