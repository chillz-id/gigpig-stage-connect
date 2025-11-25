
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, User, DollarSign, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BookComedianFormProps {
  prefilledComedianId?: string;
  prefilledComedianName?: string;
  prefilledDate?: string;
}

export const BookComedianForm: React.FC<BookComedianFormProps> = ({ 
  prefilledComedianId,
  prefilledComedianName,
  prefilledDate
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    prefilledDate ? new Date(prefilledDate) : undefined
  );
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [specificComedian, setSpecificComedian] = useState(prefilledComedianName || '');
  const [requestType, setRequestType] = useState<'general' | 'specific'>(
    prefilledComedianId ? 'specific' : 'general'
  );

  const createBookingRequest = useMutation({
    mutationFn: async (requestData: {
      event_date: string;
      event_time: string;
      venue: string;
      budget?: number;
      requested_comedian_id?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('booking_requests')
        .insert({
          requester_id: user.id,
          ...requestData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Booking Request Sent",
        description: "Your booking request has been submitted. Comedians will be notified and can respond to your request.",
      });
      
      // Reset form
      setSelectedDate(undefined);
      setEventTime('');
      setVenue('');
      setBudget('');
      setNotes('');
      setSpecificComedian('');
      setRequestType('general');
      
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
    onError: (error) => {
      console.error('Error creating booking request:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !eventTime || !venue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (date, time, and venue).",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      event_time: eventTime,
      venue: venue,
      budget: budget ? parseFloat(budget) : undefined,
      requested_comedian_id: requestType === 'specific' && (prefilledComedianId || specificComedian) ? (prefilledComedianId || specificComedian) : undefined,
      notes: notes || undefined,
    };

    createBookingRequest.mutate(requestData);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Book a Comedian
        </CardTitle>
        <CardDescription>
          Submit a request to book a comedian for your event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select value={requestType} onValueChange={(value: 'general' | 'specific') => setRequestType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Request (Any Available Comedian)</SelectItem>
                <SelectItem value="specific">Specific Comedian Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific Comedian (if selected) */}
          {requestType === 'specific' && (
            <div className="space-y-2">
              <Label htmlFor="specific-comedian">Comedian Name/Username</Label>
              <Input
                id="specific-comedian"
                placeholder="Enter comedian's name or username"
                value={specificComedian}
                onChange={(e) => setSpecificComedian(e.target.value)}
                disabled={!!prefilledComedianId}
              />
            </div>
          )}

          {/* Event Date */}
          <div className="space-y-2">
            <Label>Event Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="professional-button w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select event date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Event Time */}
          <div className="space-y-2">
            <Label htmlFor="event-time">Event Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="event-time"
                type="time"
                className="pl-10"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="venue"
                placeholder="Enter venue name and address"
                className="pl-10"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                placeholder="Enter your budget"
                className="pl-10"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional details about your event, requirements, or preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Updated Information Box */}
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">How it works:</h4>
            
            {requestType === 'specific' ? (
              <div className="space-y-2">
                <h5 className="font-medium text-blue-800 dark:text-blue-200">Specific Comedian Request:</h5>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                  <li>• Your request will be sent directly to the specified comedian</li>
                  <li>• The comedian will review your event details and budget</li>
                  <li>• They can accept, decline, or negotiate the terms</li>
                  <li>• You'll receive a notification when they respond</li>
                  <li>• If accepted, you can finalize booking details directly with them</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <h5 className="font-medium text-blue-800 dark:text-blue-200">General Request:</h5>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                  <li>• Your request will be visible to all available comedians</li>
                  <li>• Multiple comedians can submit proposals for your event</li>
                  <li>• You'll receive notifications when comedians respond</li>
                  <li>• Review comedian profiles, rates, and availability</li>
                  <li>• Choose your preferred comedian and finalize the booking</li>
                </ul>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createBookingRequest.isPending}
          >
            {createBookingRequest.isPending ? 'Submitting...' : 'Submit Booking Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
