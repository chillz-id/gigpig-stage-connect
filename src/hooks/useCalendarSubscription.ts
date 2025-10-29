import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Helper function to get Supabase Edge Function URL - extracted for testability
export const getSupabaseUrl = (): string => {
  // In tests, this will be mocked
  if (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) {
    return (window as any).__SUPABASE_URL__;
  }
  return import.meta.env.VITE_SUPABASE_URL || '';
};

export function useCalendarSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch or create subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['calendar-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to get existing subscription
      const { data: existing, error } = await supabase
        .from('calendar_subscriptions')
        .select('id, token, created_at, last_accessed_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existing) return existing;

      // If not found, create new subscription via function
      const { data: newSub, error: createError } = await supabase
        .rpc('get_or_create_calendar_subscription', { p_user_id: user.id });

      if (createError) throw createError;

      // Fetch the created subscription
      const { data: created } = await supabase
        .from('calendar_subscriptions')
        .select('id, token, created_at, last_accessed_at')
        .eq('user_id', user.id)
        .single();

      return created;
    },
    enabled: !!user,
  });

  // Regenerate token mutation
  const regenerateToken = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('regenerate_calendar_token', { p_user_id: user.id });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-subscription'] });
      toast({
        title: 'Token regenerated',
        description: 'Your old subscription link will no longer work.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to regenerate token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate subscription URL
  const getSubscriptionUrl = (token: string, format: 'webcal' | 'https' = 'webcal'): string => {
    const supabaseUrl = getSupabaseUrl();
    // Supabase Edge Functions URL format: https://PROJECT_REF.supabase.co/functions/v1/FUNCTION_NAME
    // Extract the base domain and construct the Edge Function URL
    const baseUrl = supabaseUrl.replace(/^https?:\/\//, '');
    const protocol = format === 'webcal' ? 'webcal://' : 'https://';
    return `${protocol}${baseUrl}/functions/v1/calendar-feed/${token}.ics`;
  };

  return {
    subscription,
    isLoading,
    regenerateToken: regenerateToken.mutate,
    isRegenerating: regenerateToken.isPending,
    getSubscriptionUrl,
  };
}
