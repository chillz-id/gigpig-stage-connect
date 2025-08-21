
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type EventTemplate = Tables<'event_templates'>;
type EventTemplateInsert = TablesInsert<'event_templates'>;
type EventTemplateUpdate = TablesUpdate<'event_templates'>;

export const useEventTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's templates
  const {
    data: templates = [],
    isLoading
  } = useQuery({
    queryKey: ['event-templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('promoter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EventTemplate[];
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: Omit<EventTemplateInsert, 'promoter_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_templates')
        .insert({
          ...templateData,
          promoter_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
      toast({
        title: "Template saved",
        description: "Your event template has been saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-templates'] });
      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete template",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending
  };
};
