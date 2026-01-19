import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkSection {
  id: string;
  user_id: string;
  title: string;
  layout: 'stacked' | 'grid';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;           // Optional subtitle text
  icon_type: string | null;
  thumbnail_url: string | null;          // Auto-fetched OG image
  custom_thumbnail_url: string | null;  // User-uploaded override
  section_id: string | null;             // Optional section grouping
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  section?: LinkSection;                 // JOIN result (optional)
}

interface UseCustomLinksOptions {
  userId: string;
  includeHidden?: boolean; // Only for own profile
  tableName?: string; // Custom table name for different profile types
  organizationId?: string; // If provided, query by organization_id instead of user_id
}

export const useCustomLinks = ({ userId, includeHidden = false, tableName, organizationId }: UseCustomLinksOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine table name and filter column based on organizationId
  const linksTable = tableName || (organizationId ? 'organization_custom_links' : 'custom_links');
  const sectionsTable = organizationId ? 'organization_link_sections' : 'link_sections';
  const filterColumn = organizationId ? 'organization_id' : 'user_id';
  const filterId = organizationId || userId;

  // Fetch custom links with optional section data
  const { data: links = [], isLoading, error } = useQuery({
    queryKey: ['custom-links', filterId, includeHidden, linksTable],
    queryFn: async () => {
      // Note: We can't use dynamic table joins in Supabase, so we fetch links and sections separately
      let query = supabase
        .from(linksTable)
        .select('*')
        .eq(filterColumn, filterId)
        .order('display_order', { ascending: true });

      // If not including hidden, only fetch visible links
      if (!includeHidden) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as CustomLink[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add new link
  const addLinkMutation = useMutation({
    mutationFn: async (linkData: Omit<CustomLink, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(linksTable)
        .insert({
          [filterColumn]: filterId,
          ...linkData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] });
      toast({
        title: 'Link added',
        description: 'Your custom link has been added successfully.',
      });
    },
    onError: (error) => {
      console.error('Error adding link:', error);
      toast({
        title: 'Failed to add link',
        description: 'There was an error adding your custom link.',
        variant: 'destructive',
      });
    },
  });

  // Update existing link
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomLink> & { id: string }) => {
      const { data, error } = await supabase
        .from(linksTable)
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
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] });
      toast({
        title: 'Link updated',
        description: 'Your custom link has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Error updating link:', error);
      toast({
        title: 'Failed to update link',
        description: 'There was an error updating your custom link.',
        variant: 'destructive',
      });
    },
  });

  // Delete link
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from(linksTable)
        .delete()
        .eq('id', linkId)
        .eq(filterColumn, filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] });
      toast({
        title: 'Link deleted',
        description: 'Your custom link has been removed.',
      });
    },
    onError: (error) => {
      console.error('Error deleting link:', error);
      toast({
        title: 'Failed to delete link',
        description: 'There was an error deleting your custom link.',
        variant: 'destructive',
      });
    },
  });

  // Reorder links (batch update display_order)
  const reorderLinksMutation = useMutation({
    mutationFn: async (reorderedLinks: CustomLink[]) => {
      // Update display_order for each link
      const updates = reorderedLinks.map((link, index) =>
        supabase
          .from(linksTable)
          .update({ display_order: index })
          .eq('id', link.id)
          .eq(filterColumn, filterId)
      );

      const results = await Promise.all(updates);

      // Check for any errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to reorder some links');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-links', filterId] });
      toast({
        title: 'Links reordered',
        description: 'Your link order has been updated.',
      });
    },
    onError: (error) => {
      console.error('Error reordering links:', error);
      toast({
        title: 'Failed to reorder links',
        description: 'There was an error reordering your links.',
        variant: 'destructive',
      });
    },
  });

  return {
    links,
    isLoading,
    error,
    addLink: addLinkMutation.mutate,
    updateLink: updateLinkMutation.mutate,
    deleteLink: deleteLinkMutation.mutate,
    reorderLinks: reorderLinksMutation.mutate,
    isAddingLink: addLinkMutation.isPending,
    isUpdatingLink: updateLinkMutation.isPending,
    isDeletingLink: deleteLinkMutation.isPending,
    isReordering: reorderLinksMutation.isPending,
  };
};
