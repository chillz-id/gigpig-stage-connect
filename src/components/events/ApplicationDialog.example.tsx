import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubmitApplication } from '@/hooks/useSubmitApplication';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface ApplicationDialogProps {
  event: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    time?: string;
    city?: string;
    state?: string;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDialog({ event, isOpen, onOpenChange }: ApplicationDialogProps) {
  const { submitApplication, isSubmitting } = useSubmitApplication();
  const { toast } = useToast();
  
  // Form state
  const [performanceType, setPerformanceType] = useState<string>('spot');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!availabilityConfirmed) {
      toast({
        title: "Please confirm availability",
        description: "You must confirm that you're available for this event date.",
        variant: "destructive"
      });
      return;
    }

    // Submit application
    submitApplication({
      event_id: event.id,
      performance_type: performanceType as any,
      availability_status: availabilityConfirmed ? 'confirmed' : 'uncertain',
      message,
      technical_requirements: technicalRequirements,
      special_requests: specialRequests,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setPerformanceType('spot');
        setAvailabilityConfirmed(false);
        setMessage('');
        setTechnicalRequirements('');
        setSpecialRequests('');
      }
    });
  };

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply to {event.title}</DialogTitle>
            <DialogDescription>
              Submit your application to perform at this event.
            </DialogDescription>
          </DialogHeader>

          {/* Event Details */}
          <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{event.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.venue}</span>
              {event.city && event.state && (
                <span className="text-muted-foreground">• {event.city}, {event.state}</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Performance Type */}
            <div className="space-y-2">
              <Label htmlFor="performance-type">Performance Type *</Label>
              <Select value={performanceType} onValueChange={setPerformanceType}>
                <SelectTrigger id="performance-type">
                  <SelectValue placeholder="Select performance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spot">5-10 minute spot</SelectItem>
                  <SelectItem value="feature">Feature (15-20 mins)</SelectItem>
                  <SelectItem value="headline">Headline (30-45 mins)</SelectItem>
                  <SelectItem value="mc">MC/Host</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Confirmation */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="availability"
                checked={availabilityConfirmed}
                onCheckedChange={(checked) => setAvailabilityConfirmed(checked as boolean)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="availability"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm I am available on {formattedDate} *
                </Label>
                <p className="text-sm text-muted-foreground">
                  You must be available for the entire event date
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Why do you want to perform at this event?</Label>
              <Textarea
                id="message"
                placeholder="Tell the promoter why you'd be a great fit for this show..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Technical Requirements */}
            <div className="space-y-2">
              <Label htmlFor="technical">Technical Requirements</Label>
              <Textarea
                id="technical"
                placeholder="Any special technical needs (mic preference, lighting, etc.)..."
                value={technicalRequirements}
                onChange={(e) => setTechnicalRequirements(e.target.value)}
                rows={2}
              />
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label htmlFor="special">Special Requests</Label>
              <Textarea
                id="special"
                placeholder="Any other requests or information..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              className="professional-button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}