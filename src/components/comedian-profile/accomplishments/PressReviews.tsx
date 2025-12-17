import React, { useState } from 'react';
import { ExternalLink, Plus, Edit2, Trash2 } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/button';
import { PressReviewDialog } from './PressReviewDialog';
import { format, parseISO } from 'date-fns';

interface Review {
  id: string;
  publication: string;
  rating: number;
  hookLine: string;
  url: string;
  date: string;
}

interface PressReviewsProps {
  reviews: Review[];
  isOwnProfile?: boolean;
  onAdd?: (review: { publication: string; rating: number; hookLine: string; url: string; reviewDate: string }) => void;
  onEdit?: (id: string, review: { publication: string; rating: number; hookLine: string; url: string; reviewDate: string }) => void;
  onDelete?: (id: string) => void;
}

const PressReviews: React.FC<PressReviewsProps> = ({
  reviews,
  isOwnProfile = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const handleAddClick = () => {
    setEditingReview(null);
    setDialogOpen(true);
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setDialogOpen(true);
  };

  const handleSave = (reviewData: { publication: string; rating: number; hookLine: string; url: string; reviewDate: string }) => {
    if (editingReview && onEdit) {
      onEdit(editingReview.id, reviewData);
    } else if (onAdd) {
      onAdd(reviewData);
    }
    setDialogOpen(false);
    setEditingReview(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      onDelete?.(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Reviews</h3>
        {isOwnProfile && onAdd && (
          <Button
            size="sm"
            onClick={handleAddClick}
            className="professional-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {isOwnProfile
            ? 'No reviews yet. Click "Add" to add your first review!'
            : 'No reviews listed yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 group">
              <div className="flex items-start justify-between mb-2">
                <StarRating rating={review.rating} readonly />
                {isOwnProfile && (onEdit || onDelete) && (
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(review)}
                        className="h-7 w-7 sm:w-auto px-1 sm:px-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(review.id)}
                        className="h-7 w-7 sm:w-auto px-1 sm:px-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <blockquote className="text-gray-300 italic mb-3">
                "{review.hookLine}"
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{review.publication}</p>
                  <p className="text-gray-400 text-sm">
                    {review.date ? format(parseISO(review.date), 'dd/MM/yyyy') : ''}
                  </p>
                </div>
                {review.url && (
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm sm:text-base"
                  >
                    Read Full Review
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PressReviewDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingReview(null);
        }}
        onSave={handleSave}
        currentReview={editingReview ? {
          publication: editingReview.publication,
          rating: editingReview.rating,
          hookLine: editingReview.hookLine,
          url: editingReview.url,
          reviewDate: editingReview.date,
        } : undefined}
        mode={editingReview ? 'edit' : 'add'}
      />
    </div>
  );
};

export default PressReviews;
