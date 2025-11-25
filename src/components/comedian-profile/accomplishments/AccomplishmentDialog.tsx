import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AccomplishmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accomplishment: string) => void;
  currentAccomplishment?: string;
  mode: 'add' | 'edit';
}

export const AccomplishmentDialog: React.FC<AccomplishmentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAccomplishment = '',
  mode,
}) => {
  const [accomplishment, setAccomplishment] = useState(currentAccomplishment);

  useEffect(() => {
    setAccomplishment(currentAccomplishment);
  }, [currentAccomplishment, isOpen]);

  const handleSave = () => {
    const trimmed = accomplishment.trim();
    if (!trimmed) return;

    onSave(trimmed);
    setAccomplishment('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Accomplishment' : 'Edit Accomplishment'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accomplishment">Career Highlight</Label>
            <Textarea
              id="accomplishment"
              value={accomplishment}
              onChange={(e) => setAccomplishment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Performed at the Sydney Opera House"
              rows={3}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to save
            </p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="professional-button"
            disabled={!accomplishment.trim()}
          >
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
