
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreateEventForm } from '@/components/CreateEventForm';

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only require authentication - no role restrictions
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-md w-full">
          <CardContent className="p-6 sm:p-8 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-purple-100 mb-4 text-sm sm:text-base">Please log in to create events.</p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-gradient-to-r from-pink-500 to-purple-500 w-full"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-purple-100 text-sm sm:text-base">Build your shows and start receiving applications</p>
        </div>

        <CreateEventForm />
      </div>
    </div>
  );
};

export default CreateEvent;
