import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SegmentWithId } from '@/services/crm/segment-service';

interface EditSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: SegmentWithId | null;
  onSubmit: (updates: { name?: string; color?: string | null; description?: string | null }) => void;
  isSubmitting: boolean;
}

const DEFAULT_COLOR_SWATCH = '#9ca3af';

export function EditSegmentDialog({
  open,
  onOpenChange,
  segment,
  onSubmit,
  isSubmitting,
}: EditSegmentDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setColor(segment.color ?? '');
      setDescription(segment.description ?? '');
    }
  }, [segment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      color: color || null,
      description: description.trim() || null,
    });
  };

  const handleClearColor = () => {
    setColor('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Segment</DialogTitle>
            <DialogDescription>
              Update the segment details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="segment-name">Segment Name</Label>
            <Input
              id="segment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Loyalty Members"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment-description">
              Description <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="segment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What defines this segment?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment-colour">
              Badge Colour <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="segment-colour"
                type="color"
                value={color || DEFAULT_COLOR_SWATCH}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer p-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {color ? color.toUpperCase() : 'No colour selected'}
                </span>
                {color && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={handleClearColor}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
