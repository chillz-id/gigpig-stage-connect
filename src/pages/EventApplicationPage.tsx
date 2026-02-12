import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useEvents } from '@/hooks/data/useEvents';
import { useSubmitApplication } from '@/hooks/useSubmitApplication';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ApplicationFormData } from '@/types/application';

const EventApplicationPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const { events, isLoading } = useEvents();
  const { submitApplication, isSubmitting } = useSubmitApplication();
  const { userApplications } = useEventApplications();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const event = events.find(e => e.id === eventId);

  // Check if user has already applied
  const hasApplied = userApplications.some(app => app.event_id === eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <div className="text-white text-xl">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-purple-100 mb-4">The event you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/shows')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Browse Other Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.event_date || event.date);
  const now = new Date();
  const isPastEvent = eventDate < now;

  const handleApplicationSubmit = async (data: ApplicationFormData) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to apply for shows.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check role
    if (user.role !== 'comedian') {
      toast({
        title: "Invalid role",
        description: "Only comedians can apply to perform at events.",
        variant: "destructive",
      });
      return;
    }

    // Check if verified-only event
    if (event.is_verified_only && !user.isVerified) {
      toast({
        title: "Verification required",
        description: "This show requires Comedian Pro members only. Upgrade to Pro to get verified!",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitApplication(data);
      setShowApplicationForm(false);
      // Navigate after a short delay to allow the toast to show
      setTimeout(() => {
        navigate('/shows');
      }, 1500);
    } catch (error) {
      // Error is handled by the hook
      console.error('Application submission error:', error);
    }
  };

  // Don't allow applications for past events or if already applied
  if (isPastEvent) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-2xl font-bold mb-4">Event Has Passed</h1>
            <p className="text-purple-100 mb-4">This event has already occurred and is no longer accepting applications.</p>
            <Button onClick={() => navigate('/shows')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Find Upcoming Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-[#131b2b] flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h1 className="text-2xl font-bold mb-4">Already Applied</h1>
            <p className="text-purple-100 mb-4">You have already submitted an application for this event.</p>
            <Button onClick={() => navigate('/shows')} className="bg-gradient-to-r from-pink-500 to-purple-500">
              Browse Other Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131b2b]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Details
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Event Summary */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Apply to Perform</CardTitle>
              <CardDescription className="text-gray-200 text-lg">
                {event.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-300" />
                  <span>{eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-300" />
                  <span>{event.start_time || 'Time TBA'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-purple-300" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-purple-300" />
                  <span>{event.is_paid ? 'Paid Spot' : 'Unpaid Spot'}</span>
                </div>
              </div>

              {/* Event Requirements */}
              {event.requirements && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Event Requirements:</p>
                  <p className="text-gray-100 whitespace-pre-line">{event.requirements}</p>
                </div>
              )}

              {/* Special Badges */}
              <div className="flex flex-wrap gap-2">
                {event.is_verified_only && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    <Star className="w-3 h-3 mr-1" />
                    Comedian Pro Only
                  </Badge>
                )}
                {event.type && (
                  <Badge className="professional-button text-white border-white/30">
                    {event.type}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application CTA */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle>Ready to Apply?</CardTitle>
              <CardDescription className="text-gray-200">
                Submit your application to perform at this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-100">
                  Click the button below to open the application form. You'll be able to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-200 text-sm">
                  <li>Select your preferred spot type (MC, Feature, Headliner, or Guest)</li>
                  <li>Include a message to the promoter</li>
                  <li>Confirm your availability</li>
                  <li>Acknowledge event requirements</li>
                </ul>
                
                <Separator className="bg-white/20" />
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    className="professional-button flex-1 text-white border-white/30 hover:bg-white/10"
                    onClick={() => navigate(`/events/${eventId}`)}
                  >
                    Back to Event
                  </Button>
                  <Button
                    onClick={() => setShowApplicationForm(true)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Application Form Dialog */}
      {event && (
        <ApplicationForm
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
          eventId={eventId!}
          eventTitle={event.title}
          onSubmit={handleApplicationSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default EventApplicationPage;