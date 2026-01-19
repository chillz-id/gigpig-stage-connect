import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LinkSection } from './useCustomLinks';

interface UseLinkSectionsOptions {
  userId: string;
  organizationId?: string; // If provided, query by organization_id instead of user_id
}

export const useLinkSections = ({ userId, organizationId }: UseLinkSectionsOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine table name and filter column based on organizationId
  const tableName = organizationId ? 'organization_link_sections' : 'link_sections';
  const filterColumn = organizationId ? 'organization_id' : 'user_id';
  const filterId = organizationId || userId;

  // Fetch link sections for a user or organization
  const { data: sections = [], isLoading, error } = useQuery({
    queryKey: ['link-sections', filterId, tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(filterColumn, filterId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as LinkSection[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add new section
  const addSectionMutation = useMutation({
    mutationFn: async (sectionData: Omit<LinkSection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          [filterColumn]: filterId,
          ...sectionData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-sections', filterId] });
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] }); // Refresh links too
      toast({
        title: 'Section added',
        description: 'Your link section has been created successfully.',
      });
    },
    onError: (error) => {
      console.error('Error adding section:', error);
      toast({
        title: 'Failed to add section',
        description: 'There was an error creating your section.',
        variant: 'destructive',
      });
    },
  });

  // Update existing section
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LinkSection> & { id: string }) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq(filterColumn, filterId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-sections', filterId] });
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] }); // Refresh links too
      toast({
        title: 'Section updated',
        description: 'Your section has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating section:', error);
      toast({
        title: 'Failed to update section',
        description: 'There was an error updating your section.',
        variant: 'destructive',
      });
    },
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', sectionId)
        .eq(filterColumn, filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-sections', filterId] });
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] }); // Refresh links (section_id will be null)
      toast({
        title: 'Section deleted',
        description: 'Your section has been removed. Links have been moved to unsectioned.',
      });
    },
    onError: (error) => {
      console.error('Error deleting section:', error);
      toast({
        title: 'Failed to delete section',
        description: 'There was an error deleting your section.',
        variant: 'destructive',
      });
    },
  });

  // Reorder sections (batch update display_order)
  const reorderSectionsMutation = useMutation({
    mutationFn: async (reorderedSections: LinkSection[]) => {
      // Update display_order for each section
      const updates = reorderedSections.map((section, index) =>
        supabase
          .from(tableName)
          .update({ display_order: index })
          .eq('id', section.id)
          .eq(filterColumn, filterId)
      );

      const results = await Promise.all(updates);

      // Check for any errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to reorder some sections');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link-sections', filterId] });
      toast({
        title: 'Sections reordered',
        description: 'Your section order has been updated.',
      });
    },
    onError: (error) => {
      console.error('Error reordering sections:', error);
      toast({
        title: 'Failed to reorder sections',
        description: 'There was an error reordering your sections.',
        variant: 'destructive',
      });
    },
  });

  return {
    sections,
    isLoading,
    error,
    addSection: addSectionMutation.mutate,
    updateSection: updateSectionMutation.mutate,
    deleteSection: deleteSectionMutation.mutate,
    reorderSections: reorderSectionsMutation.mutate,
    isAddingSection: addSectionMutation.isPending,
    isUpdatingSection: updateSectionMutation.isPending,
    isDeletingSection: deleteSectionMutation.isPending,
    isReordering: reorderSectionsMutation.isPending,
  };
};
