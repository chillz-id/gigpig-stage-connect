import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Types for organization media
 */
export interface OrganizationMedia {
  id: string;
  organization_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size: number | null;
  mime_type: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  uploaded_by: string;
  upload_date: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMediaInput {
  file_url: string;
  file_type: 'image' | 'video';
  file_size?: number;
  mime_type?: string;
  title?: string;
  description?: string;
  tags?: string[];
  display_order?: number;
  is_featured?: boolean;
}

/**
 * Hook to fetch media for the current organization
 *
 * @param fileType - Optional filter by file type ('image' | 'video')
 *
 * @example
 * ```tsx
 * function OrganizationMediaLibrary() {
 *   const { data: media, isLoading } = useOrganizationMedia();
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {media?.map(item => (
 *         <MediaCard key={item.id} media={item} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useOrganizationMedia = (fileType?: 'image' | 'video') => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-media', orgId, fileType],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      let query = supabase
        .from('organization_media')
        .select(`
          *,
          uploaded_by_profile:uploaded_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fileType) {
        query = query.eq('file_type', fileType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching organization media:', error);
        throw error;
      }

      return data as OrganizationMedia[];
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to get featured media for the current organization
 */
export const useOrganizationFeaturedMedia = () => {
  const { orgId } = useOrganization();

  return useQuery({
    queryKey: ['organization-featured-media', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('organization_media')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_featured', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching featured media:', error);
        throw error;
      }

      return data as OrganizationMedia[];
    },
    enabled: !!orgId,
  });
};

/**
 * Hook to upload media to the organization library
 *
 * @example
 * ```tsx
 * function UploadMediaForm() {
 *   const { mutate: uploadMedia } = useUploadOrganizationMedia();
 *
 *   const handleUpload = async (file: File) => {
 *     // Upload file to Supabase Storage first
 *     const { data: uploadData } = await supabase.storage
 *       .from('organization-media')
 *       .upload(`${orgId}/${file.name}`, file);
 *
 *     // Then create media record
 *     uploadMedia({
 *       file_url: uploadData.path,
 *       file_type: file.type.startsWith('image/') ? 'image' : 'video',
 *       file_size: file.size,
 *       mime_type: file.type,
 *       title: file.name
 *     });
 *   };
 * }
 * ```
 */
export const useUploadOrganizationMedia = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateMediaInput) => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const { data, error } = await supabase
        .from('organization_media')
        .insert({
          organization_id: orgId,
          ...input,
        })
        .select()
        .single();

      if (error) {
        console.error('Error uploading organization media:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-media', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-featured-media', orgId] });
      toast({
        title: 'Media uploaded',
        description: 'The media has been added to your library.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error uploading media',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update organization media
 */
export const useUpdateOrganizationMedia = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      mediaId,
      updates
    }: {
      mediaId: string;
      updates: Partial<CreateMediaInput>
    }) => {
      const { data, error } = await supabase
        .from('organization_media')
        .update(updates)
        .eq('id', mediaId)
        .eq('organization_id', orgId!)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization media:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-media', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-featured-media', orgId] });
      toast({
        title: 'Media updated',
        description: 'The media has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating media',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete organization media
 */
export const useDeleteOrganizationMedia = () => {
  const { orgId } = useOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase
        .from('organization_media')
        .delete()
        .eq('id', mediaId)
        .eq('organization_id', orgId!);

      if (error) {
        console.error('Error deleting organization media:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-media', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-featured-media', orgId] });
      toast({
        title: 'Media deleted',
        description: 'The media has been removed from your library.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting media',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
