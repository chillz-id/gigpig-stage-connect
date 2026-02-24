/**
 * Hook for fetching scheduled posts from Metricool.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from '@/services/social/metricool-posts';
import type { ScheduledPost } from '@/types/social';

const POSTS_QUERY_KEY = 'metricool-posts';

/**
 * Fetch scheduled posts for a date range.
 */
export function useScheduledPosts(start: string, end: string, blogId?: string, enabled = true) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, start, end, blogId],
    queryFn: () => getPosts(start, end, 'Australia/Sydney', blogId),
    enabled: enabled && !!start && !!end,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new scheduled post.
 */
export function useCreatePost(blogId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post: ScheduledPost) => createPost(post, blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}

/**
 * Update an existing scheduled post.
 */
export function useUpdatePost(blogId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, post }: { id: number; post: ScheduledPost }) =>
      updatePost(id, post, blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}

/**
 * Delete a scheduled post.
 */
export function useDeletePost(blogId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePost(id, blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}
