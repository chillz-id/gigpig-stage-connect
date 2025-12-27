import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/StarRating';

interface PressReviewData {
  publication: string;
  rating: number;
  hookLine: string;
  url: string;
  reviewDate: string;
}

interface PressReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: PressReviewData) => void;
  currentReview?: PressReviewData;
  mode: 'add' | 'edit';
}

export const PressReviewDialog: React.FC<PressReviewDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentReview,
  mode,
}) => {
  const [formData, setFormData] = useState<PressReviewData>({
    publication: '',
    rating: 0,
    hookLine: '',
    url: '',
    reviewDate: '',
  });

  useEffect(() => {
    if (currentReview) {
      setFormData(currentReview);
    } else {
      setFormData({
        publication: '',
        rating: 0,
        hookLine: '',
        url: '',
        reviewDate: '',
      });
    }
  }, [currentReview, isOpen]);

  const handleSave = () => {
    if (!formData.publication.trim() || !formData.hookLine.trim() || !formData.reviewDate) {
      return;
    }

    onSave({
      ...formData,
      publication: formData.publication.trim(),
      hookLine: formData.hookLine.trim(),
      url: formData.url.trim(),
    });

    setFormData({
      publication: '',
      rating: 0,
      hookLine: '',
      url: '',
      reviewDate: '',
    });
    onClose();
  };

  const isValid = formData.publication.trim() && formData.hookLine.trim() && formData.reviewDate;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Press Review' : 'Edit Press Review'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="publication">Publication *</Label>
            <Input
              id="publication"
              value={formData.publication}
              onChange={(e) => setFormData({ ...formData, publication: e.target.value })}
              placeholder="e.g., The Sydney Morning Herald"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Rating *</Label>
            <StarRating
              rating={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              showValue
              size="lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hookLine">Review Quote *</Label>
            <Textarea
              id="hookLine"
              value={formData.hookLine}
              onChange={(e) => setFormData({ ...formData, hookLine: e.target.value })}
              placeholder="The most memorable quote from the review"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Review URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewDate">Review Date *</Label>
            <Input
              id="reviewDate"
              type="date"
              value={formData.reviewDate}
              onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="professional-button"
            disabled={!isValid}
          >
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
