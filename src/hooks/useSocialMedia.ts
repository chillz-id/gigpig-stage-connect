/**
 * useSocialMedia Hook
 * React hook for managing social media scheduling with Postiz
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/contexts/UserContext';
import { postizService, type SchedulePostParams, type ConnectChannelParams } from '@/services/social/postiz-service';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing user's connected social channels
 */
export function useSocialChannels() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const channelsQuery = useQuery({
    queryKey: ['social-channels', user?.id],
    queryFn: () => postizService.getUserChannels(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const connectMutation = useMutation({
    mutationFn: (params: ConnectChannelParams) =>
      postizService.connectChannel(user?.id || '', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-channels'] });
      toast({
        title: 'Channel connected',
        description: 'Your social media account has been connected successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect channel',
        variant: 'destructive',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (channelId: string) =>
      postizService.disconnectChannel(user?.id || '', channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-channels'] });
      toast({
        title: 'Channel disconnected',
        description: 'Your social media account has been disconnected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Disconnection failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect channel',
        variant: 'destructive',
      });
    },
  });

  return {
    channels: channelsQuery.data || [],
    isLoading: channelsQuery.isLoading,
    error: channelsQuery.error,
    connectChannel: connectMutation.mutate,
    disconnectChannel: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}

/**
 * Hook for managing scheduled posts
 */
export function useSocialPosts() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['social-posts', user?.id],
    queryFn: () => postizService.getUserPosts(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const upcomingQuery = useQuery({
    queryKey: ['social-posts-upcoming', user?.id],
    queryFn: () => postizService.getUpcomingPosts(user?.id || '', 10),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const scheduleMutation = useMutation({
    mutationFn: (params: SchedulePostParams) =>
      postizService.schedulePost(user?.id || '', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts-upcoming'] });
      toast({
        title: 'Post scheduled',
        description: 'Your post has been scheduled successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Scheduling failed',
        description: error instanceof Error ? error.message : 'Failed to schedule post',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: Partial<SchedulePostParams> }) =>
      postizService.updatePost(user?.id || '', postId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (postId: string) =>
      postizService.cancelPost(user?.id || '', postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: 'Post cancelled',
        description: 'Your scheduled post has been cancelled.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation failed',
        description: error instanceof Error ? error.message : 'Failed to cancel post',
        variant: 'destructive',
      });
    },
  });

  return {
    posts: postsQuery.data || [],
    upcomingPosts: upcomingQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    schedulePost: scheduleMutation.mutate,
    updatePost: updateMutation.mutate,
    cancelPost: cancelMutation.mutate,
    isScheduling: scheduleMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

/**
 * Hook for managing post templates
 */
export function useSocialTemplates() {
  const { user } = useUser();

  const templatesQuery = useQuery({
    queryKey: ['social-templates', user?.id],
    queryFn: () => postizService.getTemplates(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    applyTemplate: postizService.applyTemplate.bind(postizService),
  };
}

/**
 * Hook for social media analytics
 */
export function useSocialAnalytics() {
  const { user } = useUser();

  const analyticsQuery = useQuery({
    queryKey: ['social-analytics', user?.id],
    queryFn: () => postizService.getUserAnalytics(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getPostAnalytics = (postId: string) => {
    return useQuery({
      queryKey: ['social-analytics', 'post', postId],
      queryFn: () => postizService.getPostAnalytics(user?.id || '', postId),
      enabled: !!user?.id && !!postId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
    getPostAnalytics,
  };
}
