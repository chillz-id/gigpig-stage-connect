import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listBugs,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  listBugComments,
  addBugComment,
  updateBugComment,
  deleteBugComment,
  type BugReport,
  type BugComment,
} from '@/services/bugs/bug-service';

/**
 * Query all bugs, optionally filtered by status
 */
export function useBugs(status?: string) {
  return useQuery({
    queryKey: ['bugs', status],
    queryFn: () => listBugs(status),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query single bug
 */
export function useBug(id: string) {
  return useQuery({
    queryKey: ['bug', id],
    queryFn: () => getBug(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mutation to create bug
 */
export function useCreateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBug,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
    },
  });
}

/**
 * Mutation to update bug
 */
export function useUpdateBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBug(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      queryClient.invalidateQueries({ queryKey: ['bug', variables.id] });
    },
  });
}

/**
 * Mutation to delete bug
 */
export function useDeleteBug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBug,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
    },
  });
}

/**
 * Query bug comments
 */
export function useBugComments(bugId: string) {
  return useQuery({
    queryKey: ['bug-comments', bugId],
    queryFn: () => listBugComments(bugId),
    enabled: !!bugId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Mutation to add comment
 */
export function useAddBugComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bugId, content }: { bugId: string; content: string }) =>
      addBugComment(bugId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bug-comments', variables.bugId] });
      queryClient.invalidateQueries({ queryKey: ['bug', variables.bugId] });
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
    },
  });
}

/**
 * Mutation to update comment
 */
export function useUpdateBugComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, bugId }: { id: string; content: string; bugId: string }) =>
      updateBugComment(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bug-comments', variables.bugId] });
    },
  });
}

/**
 * Mutation to delete comment
 */
export function useDeleteBugComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bugId }: { id: string; bugId: string }) => deleteBugComment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bug-comments', variables.bugId] });
      queryClient.invalidateQueries({ queryKey: ['bug', variables.bugId] });
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
    },
  });
}
