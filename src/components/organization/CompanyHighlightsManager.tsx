import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Plus, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OrganizationHighlight {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  date: string | null;
  category: 'event' | 'partnership' | 'award' | 'milestone' | null;
  created_at: string;
  updated_at: string;
}

interface HighlightFormData {
  title: string;
  description: string;
  date: string;
  category: 'event' | 'partnership' | 'award' | 'milestone' | '';
}

const CATEGORY_LABELS = {
  event: 'Event',
  partnership: 'Partnership',
  award: 'Award',
  milestone: 'Milestone',
};

const CATEGORY_COLORS = {
  event: 'bg-blue-500',
  partnership: 'bg-green-500',
  award: 'bg-yellow-500',
  milestone: 'bg-purple-500',
};

export default function CompanyHighlightsManager() {
  const { organization, isOwner, isAdmin } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganizationHighlight | null>(null);

  const canEdit = isOwner || isAdmin;

  const [formData, setFormData] = useState<HighlightFormData>({
    title: '',
    description: '',
    date: '',
    category: '',
  });

  // Fetch highlights
  const { data: highlights = [], isLoading } = useQuery({
    queryKey: ['organization-highlights', organization?.id],
    queryFn: async () => {
      if (!organization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('organization_highlights')
        .select('*')
        .eq('organization_id', organization.id)
        .order('date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as OrganizationHighlight[];
    },
    enabled: !!organization?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: HighlightFormData) => {
      if (!organization?.id) throw new Error('No organization');

      const { error } = await supabase.from('organization_highlights').insert({
        organization_id: organization.id,
        title: data.title,
        description: data.description || null,
        date: data.date || null,
        category: data.category || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-highlights'] });
      toast({
        title: 'Highlight Added',
        description: 'Company highlight has been added successfully',
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add highlight',
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
      data: HighlightFormData;
    }) => {
      const { error } = await supabase
        .from('organization_highlights')
        .update({
          title: data.title,
          description: data.description || null,
          date: data.date || null,
          category: data.category || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-highlights'] });
      toast({
        title: 'Highlight Updated',
        description: 'Company highlight has been updated successfully',
      });
      resetForm();
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update highlight',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-highlights'] });
      toast({
        title: 'Highlight Deleted',
        description: 'Company highlight has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete highlight',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      category: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
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

  const handleEdit = (item: OrganizationHighlight) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      date: item.date || '',
      category: (item.category as HighlightFormData['category']) || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this highlight?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingItem(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading company highlights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company Highlight
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Company Highlight' : 'Add Company Highlight'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Won Best Comedy Event 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Additional details about this achievement..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        category: value as HighlightFormData['category'],
                      })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                    </SelectContent>
                  </Select>
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
      )}

      {/* Highlights List */}
      {highlights.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No company highlights yet</p>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? 'Add achievements, awards, partnerships, and major milestones'
              : 'No highlights have been added to this organization'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {highlights.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.category && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            CATEGORY_COLORS[item.category]
                          }`}
                        ></span>
                      )}
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.category && (
                        <span className="text-xs text-muted-foreground">
                          ({CATEGORY_LABELS[item.category]})
                        </span>
                      )}
                    </div>

                    {item.date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    )}

                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
