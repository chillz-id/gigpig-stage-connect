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
export function useScheduledPosts(start: string, end: string, enabled = true) {
  return useQuery({
    queryKey: [POSTS_QUERY_KEY, start, end],
    queryFn: () => getPosts(start, end),
    enabled: enabled && !!start && !!end,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new scheduled post.
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post: ScheduledPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}

/**
 * Update an existing scheduled post.
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, post }: { id: number; post: ScheduledPost }) =>
      updatePost(id, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}

/**
 * Delete a scheduled post.
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POSTS_QUERY_KEY] });
    },
  });
}
