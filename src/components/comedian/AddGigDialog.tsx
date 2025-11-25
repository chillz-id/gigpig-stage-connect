import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMyGigs } from '@/hooks/useMyGigs';
import { useAuth } from '@/contexts/AuthContext';
import { EventBannerUpload } from '@/components/gigs/EventBannerUpload';
import { Loader2 } from 'lucide-react';

interface AddGigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGigDialog({ open, onOpenChange }: AddGigDialogProps) {
  const { user } = useAuth();
  const { createGig, isCreating } = useMyGigs();

  const [formData, setFormData] = useState({
    title: '',
    venue_name: '',
    venue_address: '',
    start_datetime: '',
    end_datetime: '',
    description: '',
    ticket_link: '',
    banner_url: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start date and time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎭 [AddGigDialog] Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('❌ [AddGigDialog] Validation failed');
      return;
    }

    if (!user?.id) {
      console.log('❌ [AddGigDialog] No user ID');
      return;
    }

    const gigData = {
      user_id: user.id,
      title: formData.title.trim(),
      venue_name: formData.venue_name.trim() || null,
      venue_address: formData.venue_address.trim() || null,
      start_datetime: formData.start_datetime,
      end_datetime: formData.end_datetime || null,
      description: formData.description.trim() || null,
      ticket_link: formData.ticket_link.trim() || null,
      banner_url: formData.banner_url || null
    };

    console.log('🎭 [AddGigDialog] Calling createGig with:', gigData);
    createGig(gigData);

    // Reset form and close dialog
    setFormData({
      title: '',
      venue_name: '',
      venue_address: '',
      start_datetime: '',
      end_datetime: '',
      description: '',
      ticket_link: '',
      banner_url: ''
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Manual Gig</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Banner (Optional)</Label>
            <EventBannerUpload
              onBannerSelected={(url) => setFormData({ ...formData, banner_url: url })}
              currentBannerUrl={formData.banner_url}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Open Mic Night"
              disabled={isCreating}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              placeholder="e.g., The Comedy Store"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_address">Venue Address</Label>
            <Input
              id="venue_address"
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              placeholder="e.g., 1 Comedy Lane, Sydney"
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_datetime">Start Date & Time *</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                disabled={isCreating}
              />
              {errors.start_datetime && (
                <p className="text-sm text-destructive">{errors.start_datetime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_datetime">End Date & Time</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Show Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your show, what makes it special, what the audience can expect..."
              rows={3}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket_link">Ticket Link (Optional)</Label>
            <Input
              id="ticket_link"
              type="url"
              value={formData.ticket_link}
              onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
              placeholder="https://humanitix.com/... or https://eventbrite.com/..."
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Where customers can buy tickets. This will appear on your public EPK.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="professional-button"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Gig'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
