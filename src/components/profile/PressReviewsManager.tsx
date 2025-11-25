import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Edit, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { TableAwareProps } from '@/types/universalProfile';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface PressReview {
  id: string;
  publication: string;
  hook_line: string;
  rating: number | null;
  review_date: string | null;
  external_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface PressReviewFormData {
  publication: string;
  hook_line: string;
  rating: number | null;
  review_date: string;
  external_url: string;
}

// Sortable press review item component
const SortablePressReview: React.FC<{
  review: PressReview;
  onEdit: (review: PressReview) => void;
  onDelete: (id: string) => void;
}> = ({ review, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: review.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('professional-card', isDragging && 'shadow-lg')}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              className="cursor-grab active:cursor-grabbing mt-2 text-gray-400 hover:text-gray-600"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{review.publication}</h4>
                  {review.review_date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(review.review_date), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
                {review.rating && review.rating > 0 && (
                  <StarRating rating={review.rating} readonly size="sm" showValue />
                )}
              </div>
              <p className="text-sm italic">&ldquo;{review.hook_line}&rdquo;</p>
              <div className="flex gap-2 pt-2">
                {review.external_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(review.external_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Review
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(review)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(review.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PressReviewsManager: React.FC<TableAwareProps> = ({
  tableName,
  userId,
  organizationId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PressReview | null>(null);

  // Determine which ID to use (userId prop, organizationId prop, or current user)
  const profileId = userId || user?.id;
  const filterColumn = organizationId ? 'organization_id' : 'user_id';
  const filterId = organizationId || profileId;

  const [formData, setFormData] = useState<PressReviewFormData>({
    publication: '',
    hook_line: '',
    rating: null,
    review_date: '',
    external_url: '',
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch press reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['press-reviews', tableName, filterId],
    queryFn: async () => {
      if (!filterId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(filterColumn, filterId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as PressReview[];
    },
    enabled: !!filterId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PressReviewFormData) => {
      if (!filterId) throw new Error('Not authenticated or missing profile ID');

      const maxOrder = reviews.length > 0
        ? Math.max(...reviews.map(r => r.display_order))
        : -1;

      const { error } = await supabase.from(tableName).insert({
        [filterColumn]: filterId,
        publication: data.publication,
        hook_line: data.hook_line,
        rating: data.rating,
        review_date: data.review_date || null,
        external_url: data.external_url || null,
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews'] });
      toast({
        title: 'Press Review Added',
        description: 'Your press review has been added successfully',
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add press review',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: PressReviewFormData;
    }) => {
      const { error } = await supabase
        .from(tableName)
        .update({
          publication: data.publication,
          hook_line: data.hook_line,
          rating: data.rating,
          review_date: data.review_date || null,
          external_url: data.external_url || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews'] });
      toast({
        title: 'Press Review Updated',
        description: 'Your press review has been updated successfully',
      });
      resetForm();
      setEditingReview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update press review',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews'] });
      toast({
        title: 'Press Review Deleted',
        description: 'Press review has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete press review',
        variant: 'destructive',
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedReviews: PressReview[]) => {
      const updates = reorderedReviews.map((review, index) => ({
        id: review.id,
        display_order: index,
      }));

      const { error } = await supabase
        .from(tableName)
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder press reviews',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      publication: '',
      hook_line: '',
      rating: null,
      review_date: '',
      external_url: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.publication.trim() || !formData.hook_line.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Publication and hook line are required',
        variant: 'destructive',
      });
      return;
    }

    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (review: PressReview) => {
    setEditingReview(review);
    setFormData({
      publication: review.publication,
      hook_line: review.hook_line,
      rating: review.rating,
      review_date: review.review_date || '',
      external_url: review.external_url || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this press review?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingReview(null);
    resetForm();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = reviews.findIndex((r) => r.id === active.id);
    const newIndex = reviews.findIndex((r) => r.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedReviews = arrayMove(reviews, oldIndex, newIndex);
      reorderMutation.mutate(reorderedReviews);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading press reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="professional-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Press Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingReview ? 'Edit Press Review' : 'Add Press Review'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="publication">Publication *</Label>
                <Input
                  id="publication"
                  value={formData.publication}
                  onChange={(e) =>
                    setFormData({ ...formData, publication: e.target.value })
                  }
                  placeholder="e.g., The Sydney Morning Herald"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hook_line">Hook Line / Quote *</Label>
                <Textarea
                  id="hook_line"
                  value={formData.hook_line}
                  onChange={(e) =>
                    setFormData({ ...formData, hook_line: e.target.value })
                  }
                  placeholder="Key quote or excerpt from the review"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rating">Rating (Optional)</Label>
                <div className="flex items-center gap-3 pt-2">
                  <StarRating
                    rating={formData.rating || 0}
                    onChange={(newRating) =>
                      setFormData({
                        ...formData,
                        rating: newRating > 0 ? newRating : null,
                      })
                    }
                    size="lg"
                    showValue
                  />
                  {formData.rating && formData.rating > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, rating: null })}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to rate in half-star increments
                </p>
              </div>

              <div>
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) =>
                    setFormData({ ...formData, review_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="external_url">External Link</Label>
                <Input
                  id="external_url"
                  type="url"
                  value={formData.external_url}
                  onChange={(e) =>
                    setFormData({ ...formData, external_url: e.target.value })
                  }
                  placeholder="https://example.com/review"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="professional-button"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingReview ? 'Update' : 'Add'} Review
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No press reviews yet</p>
          <p className="text-sm text-muted-foreground">
            Add press reviews and media mentions to showcase your work
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={reviews.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4">
              {reviews.map((review) => (
                <SortablePressReview
                  key={review.id}
                  review={review}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
