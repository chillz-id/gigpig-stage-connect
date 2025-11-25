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

interface CreateSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  color: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onClearColor: () => void;
  previewColor: string | null;
  defaultColourSwatch: string;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const CreateSegmentDialog = ({
  open,
  onOpenChange,
  name,
  color,
  onNameChange,
  onColorChange,
  onClearColor,
  previewColor,
  defaultColourSwatch,
  onSubmit,
  isSubmitting,
}: CreateSegmentDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={(nextOpen) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        onNameChange('');
        onColorChange('');
      }
    }}
  >
    <DialogContent>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create Segment</DialogTitle>
          <DialogDescription>
            Segments let you group customers for faster filtering and workflow automation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="segment-name">Segment Name</Label>
          <Input
            id="segment-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Loyalty Members"
            autoFocus
            required
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
              value={color || defaultColourSwatch}
              onChange={(event) => onColorChange(event.target.value)}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {previewColor ?? 'No colour selected'}
              </span>
              {color && (
                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={onClearColor}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" className="professional-button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Create Segment'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);
