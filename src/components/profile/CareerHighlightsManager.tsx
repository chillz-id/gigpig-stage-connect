import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trophy, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { TableAwareProps } from '@/types/universalProfile';
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

interface Accomplishment {
  id: string;
  accomplishment: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface AccomplishmentFormData {
  accomplishment: string;
}

// Sortable accomplishment item component
const SortableAccomplishment: React.FC<{
  item: Accomplishment;
  onEdit: (item: Accomplishment) => void;
  onDelete: (id: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
              className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm">{item.accomplishment}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CareerHighlightsManager: React.FC<TableAwareProps> = ({
  tableName,
  userId,
  organizationId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Accomplishment | null>(null);

  // Determine which ID to use (userId prop, organizationId prop, or current user)
  const profileId = userId || user?.id;
  const filterColumn = organizationId ? 'organization_id' : 'user_id';
  const filterId = organizationId || profileId;

  const [formData, setFormData] = useState<AccomplishmentFormData>({
    accomplishment: '',
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch accomplishments
  const { data: accomplishments = [], isLoading } = useQuery({
    queryKey: ['accomplishments', tableName, filterId],
    queryFn: async () => {
      if (!filterId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(filterColumn, filterId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Accomplishment[];
    },
    enabled: !!filterId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: AccomplishmentFormData) => {
      if (!filterId) throw new Error('Not authenticated or missing profile ID');

      const maxOrder = accomplishments.length > 0
        ? Math.max(...accomplishments.map(a => a.display_order))
        : -1;

      const { error } = await supabase.from(tableName).insert({
        [filterColumn]: filterId,
        accomplishment: data.accomplishment,
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments'] });
      toast({
        title: 'Career Highlight Added',
        description: 'Your accomplishment has been added successfully',
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add accomplishment',
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
      data: AccomplishmentFormData;
    }) => {
      const { error } = await supabase
        .from(tableName)
        .update({
          accomplishment: data.accomplishment,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments'] });
      toast({
        title: 'Career Highlight Updated',
        description: 'Your accomplishment has been updated successfully',
      });
      resetForm();
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update accomplishment',
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
      queryClient.invalidateQueries({ queryKey: ['accomplishments'] });
      toast({
        title: 'Career Highlight Deleted',
        description: 'Accomplishment has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete accomplishment',
        variant: 'destructive',
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedItems: Accomplishment[]) => {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      const { error } = await supabase
        .from(tableName)
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder accomplishments',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      accomplishment: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accomplishment.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Accomplishment text is required',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: Accomplishment) => {
    setEditingItem(item);
    setFormData({
      accomplishment: item.accomplishment,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this accomplishment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = accomplishments.findIndex((item) => item.id === active.id);
    const newIndex = accomplishments.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(accomplishments, oldIndex, newIndex);
      reorderMutation.mutate(reorderedItems);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading career highlights...</p>
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
              Add Career Highlight
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Career Highlight' : 'Add Career Highlight'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="accomplishment">Accomplishment *</Label>
                <Textarea
                  id="accomplishment"
                  value={formData.accomplishment}
                  onChange={(e) =>
                    setFormData({ ...formData, accomplishment: e.target.value })
                  }
                  placeholder="e.g., Featured performer at Sydney Comedy Festival 2023"
                  rows={4}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Describe a career milestone, award, or notable achievement
                </p>
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
                  {editingItem ? 'Update' : 'Add'} Highlight
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accomplishments List */}
      {accomplishments.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No career highlights yet</p>
          <p className="text-sm text-muted-foreground">
            Add your notable accomplishments, awards, and career milestones
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={accomplishments.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-3">
              {accomplishments.map((item) => (
                <SortableAccomplishment
                  key={item.id}
                  item={item}
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
