import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  CalendarIcon, 
  Clock, 
  DollarSign, 
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { PhotographerProfile } from '@/types/photographer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PhotographerBookingProps {
  photographer: PhotographerProfile;
}

const PhotographerBooking: React.FC<PhotographerBookingProps> = ({ photographer }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    eventDate: undefined as Date | undefined,
    eventType: '',
    duration: '',
    message: '',
    budget: '',
  });

  const profile = photographer.photographer_profile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to book a photographer',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate booking submission
    setTimeout(() => {
      toast({
        title: 'Booking request sent!',
        description: 'The photographer will contact you soon to confirm details.',
      });
      setIsSubmitting(false);
      setBookingData({
        eventDate: undefined,
        eventType: '',
        duration: '',
        message: '',
        budget: '',
      });
    }, 2000);
  };

  const formatRate = () => {
    if (!profile?.rate_per_hour && !profile?.rate_per_event) return 'Contact for rates';
    const parts = [];
    if (profile?.rate_per_hour) parts.push(`$${profile.rate_per_hour}/hour`);
    if (profile?.rate_per_event) parts.push(`From $${profile.rate_per_event}/event`);
    return parts.join(' • ');
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Book {photographer.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rates Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <DollarSign className="w-4 h-4" />
              Rates
            </div>
            <p className="text-sm text-gray-700">{formatRate()}</p>
          </div>

          {/* Event Date */}
          <div>
            <Label htmlFor="eventDate">Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="professional-button w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bookingData.eventDate ? (
                    format(bookingData.eventDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={bookingData.eventDate}
                  onSelect={(date) => 
                    setBookingData({ ...bookingData, eventDate: date })
                  }
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Event Type */}
          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={bookingData.eventType}
              onValueChange={(value) => 
                setBookingData({ ...bookingData, eventType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comedy_show">Comedy Show</SelectItem>
                <SelectItem value="corporate_event">Corporate Event</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="headshots">Headshots Session</SelectItem>
                <SelectItem value="promotional">Promotional Shoot</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={bookingData.duration}
              onValueChange={(value) => 
                setBookingData({ ...bookingData, duration: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="half-day">Half day (4-6 hours)</SelectItem>
                <SelectItem value="full-day">Full day (8+ hours)</SelectItem>
                <SelectItem value="custom">Custom duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div>
            <Label htmlFor="budget">Budget Range (optional)</Label>
            <Input
              id="budget"
              type="text"
              placeholder="e.g., $500-$1000"
              value={bookingData.budget}
              onChange={(e) => 
                setBookingData({ ...bookingData, budget: e.target.value })
              }
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Tell the photographer about your event and any specific requirements..."
              value={bookingData.message}
              onChange={(e) => 
                setBookingData({ ...bookingData, message: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Services Included */}
          {profile?.services_offered && profile.services_offered.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Available Services:</p>
              <div className="space-y-1">
                {profile.services_offered.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>{service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !bookingData.eventDate || !bookingData.eventType}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending request...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Booking Request
              </>
            )}
          </Button>

          {!user && (
            <p className="text-sm text-gray-600 text-center">
              Please sign in to send a booking request
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotographerBooking;