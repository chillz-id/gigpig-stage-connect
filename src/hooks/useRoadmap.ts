import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  voteFeature,
  unvoteFeature,
  checkUserVote,
  getFeatureComments,
  addComment,
  updateComment,
  deleteComment,
  type FeatureRequest,
  type FeatureComment
} from '@/services/roadmap/roadmap-service';

/**
 * Query all features grouped by status
 */
export function useFeatures(status?: string) {
  return useQuery({
    queryKey: ['features', status],
    queryFn: () => listFeatures(status),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query single feature
 */
export function useFeature(id: string) {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => getFeature(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Check if user has voted
 */
export function useUserVote(featureId: string) {
  return useQuery({
    queryKey: ['feature-vote', featureId],
    queryFn: () => checkUserVote(featureId),
    enabled: !!featureId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Mutation to create feature
 */
export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

/**
 * Mutation to update feature
 */
export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateFeature>[1] }) =>
      updateFeature(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['feature', variables.id] });
    },
  });
}

/**
 * Mutation to delete feature
 */
export function useDeleteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

/**
 * Mutation to vote
 */
export function useVoteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: voteFeature,
    onSuccess: (_, featureId) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['feature', featureId] });
      queryClient.invalidateQueries({ queryKey: ['feature-vote', featureId] });
    },
  });
}

/**
 * Mutation to unvote
 */
export function useUnvoteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unvoteFeature,
    onSuccess: (_, featureId) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['feature', featureId] });
      queryClient.invalidateQueries({ queryKey: ['feature-vote', featureId] });
    },
  });
}

/**
 * Query comments for feature
 */
export function useFeatureComments(featureId: string) {
  return useQuery({
    queryKey: ['feature-comments', featureId],
    queryFn: () => getFeatureComments(featureId),
    enabled: !!featureId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Mutation to add comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ featureId, content }: { featureId: string; content: string }) =>
      addComment(featureId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature-comments', variables.featureId] });
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

/**
 * Mutation to update comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, featureId }: { id: string; content: string; featureId: string }) =>
      updateComment(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature-comments', variables.featureId] });
    },
  });
}

/**
 * Mutation to delete comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, featureId }: { id: string; featureId: string }) =>
      deleteComment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feature-comments', variables.featureId] });
      queryClient.invalidateQueries({ queryKey: ['feature', variables.featureId] });
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
