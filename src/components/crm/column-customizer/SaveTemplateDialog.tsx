import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveTemplateDialogProps {
  open: boolean;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export const SaveTemplateDialog = ({
  open,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onOpenChange,
  onSubmit,
}: SaveTemplateDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Save Column Template</DialogTitle>
        <DialogDescription>Store your current configuration for quick reuse later.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            placeholder="e.g., My Custom View"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="template-description">Description (Optional)</Label>
          <Input
            id="template-description"
            placeholder="e.g., Focus on engagement metrics"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Save Template</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
