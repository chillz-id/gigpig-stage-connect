import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMyGigs } from '@/hooks/useMyGigs';
import { EventBannerUpload } from '@/components/gigs/EventBannerUpload';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditGigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gig: {
    id: string;
    title: string;
    venue_name?: string | null;
    venue_address?: string | null;
    start_datetime: string;
    end_datetime?: string | null;
    description?: string | null;
    ticket_link?: string | null;
    banner_url?: string | null;
  };
}

export function EditGigDialog({ open, onOpenChange, gig }: EditGigDialogProps) {
  const { updateGig, deleteGig, isUpdating, isDeleting } = useMyGigs();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Parse datetime for form inputs
  const parseDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    return { date: dateStr, time: timeStr };
  };

  const startParsed = parseDateTime(gig.start_datetime);
  const endParsed = gig.end_datetime ? parseDateTime(gig.end_datetime) : { date: '', time: '' };

  const [formData, setFormData] = useState({
    title: gig.title,
    venue_name: gig.venue_name || '',
    venue_address: gig.venue_address || '',
    start_date: startParsed.date,
    start_time: startParsed.time,
    end_date: endParsed.date,
    end_time: endParsed.time,
    description: gig.description || '',
    ticket_link: gig.ticket_link || '',
    banner_url: gig.banner_url || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when gig prop changes
  useEffect(() => {
    const startParsed = parseDateTime(gig.start_datetime);
    const endParsed = gig.end_datetime ? parseDateTime(gig.end_datetime) : { date: '', time: '' };

    setFormData({
      title: gig.title,
      venue_name: gig.venue_name || '',
      venue_address: gig.venue_address || '',
      start_date: startParsed.date,
      start_time: startParsed.time,
      end_date: endParsed.date,
      end_time: endParsed.time,
      description: gig.description || '',
      ticket_link: gig.ticket_link || '',
      banner_url: gig.banner_url || ''
    });
  }, [gig]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Combine date and time for start
    const start_datetime = `${formData.start_date}T${formData.start_time}:00`;

    // Combine date and time for end (if provided)
    let end_datetime = null;
    if (formData.end_date && formData.end_time) {
      end_datetime = `${formData.end_date}T${formData.end_time}:00`;
    }

    const updates = {
      title: formData.title.trim(),
      venue_name: formData.venue_name.trim() || null,
      venue_address: formData.venue_address.trim() || null,
      start_datetime,
      end_datetime,
      description: formData.description.trim() || null,
      ticket_link: formData.ticket_link.trim() || null,
      banner_url: formData.banner_url || null
    };

    updateGig({ gigId: gig.id, updates });
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteGig(gig.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Show</DialogTitle>
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
                disabled={isUpdating}
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
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_address">Venue Address</Label>
              <Input
                id="venue_address"
                value={formData.venue_address}
                onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                placeholder="e.g., 1 Comedy Lane, Sydney"
                disabled={isUpdating}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  disabled={isUpdating}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  disabled={isUpdating}
                />
                {errors.start_time && (
                  <p className="text-sm text-destructive">{errors.start_time}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  disabled={isUpdating}
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
                disabled={isUpdating}
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
                disabled={isUpdating}
              />
              <p className="text-xs text-muted-foreground">
                Where customers can buy tickets. This will appear on your public EPK.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isUpdating || isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Show</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{gig.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
