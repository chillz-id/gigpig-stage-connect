import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ApplicationFormData, SpotType } from '@/types/application';

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting?: boolean;
}


export function ApplicationForm({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onSubmit,
  isSubmitting = false,
}: ApplicationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ApplicationFormData>({
    event_id: eventId,
    message: '',
    spot_type: 'Feature',
    availability_confirmed: false,
    requirements_acknowledged: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - message is optional

    if (!formData.availability_confirmed) {
      toast({
        title: 'Availability confirmation required',
        description: 'Please confirm your availability for this event.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.requirements_acknowledged) {
      toast({
        title: 'Requirements acknowledgment required',
        description: 'Please acknowledge that you meet the event requirements.',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply to {eventTitle}</DialogTitle>
            <DialogDescription>
              Complete this form to submit your application for this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Message Field */}
            <div className="grid gap-2">
              <Label htmlFor="message">
                Message to Promoter (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Tell the promoter why you'd be a great fit for this show..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Spot Type Selection */}
            <div className="grid gap-2">
              <Label>
                Preferred Spot Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.spot_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    spot_type: value as SpotType,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MC" id="mc" />
                  <Label htmlFor="mc" className="font-normal">
                    MC (Host)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Feature" id="feature" />
                  <Label htmlFor="feature" className="font-normal">
                    Feature Act
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Headliner" id="headliner" />
                  <Label htmlFor="headliner" className="font-normal">
                    Headliner
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Guest" id="guest" />
                  <Label htmlFor="guest" className="font-normal">
                    Guest Spot
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Availability Confirmation */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="availability"
                checked={formData.availability_confirmed}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    availability_confirmed: checked as boolean,
                  })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="availability"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm my availability for this event{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  I am available to perform on the scheduled date and time.
                </p>
              </div>
            </div>

            {/* Requirements Acknowledgment */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="requirements"
                checked={formData.requirements_acknowledged}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    requirements_acknowledged: checked as boolean,
                  })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="requirements"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I meet all event requirements{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have read and meet all the requirements for this event.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}