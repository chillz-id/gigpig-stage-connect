import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMyGigs } from '@/hooks/useMyGigs';
import { useAuth } from '@/contexts/AuthContext';
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
    notes: ''
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

    if (!validateForm() || !user?.id) return;

    createGig({
      user_id: user.id,
      title: formData.title.trim(),
      venue_name: formData.venue_name.trim() || null,
      venue_address: formData.venue_address.trim() || null,
      start_datetime: formData.start_datetime,
      end_datetime: formData.end_datetime || null,
      notes: formData.notes.trim() || null
    });

    // Reset form and close dialog
    setFormData({
      title: '',
      venue_name: '',
      venue_address: '',
      start_datetime: '',
      end_datetime: '',
      notes: ''
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={3}
              disabled={isCreating}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
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
