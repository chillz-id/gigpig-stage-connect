import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { BaseApi, QueryOptions, handleApiError, handleApiSuccess } from './base';

export interface CrudHookOptions<T> {
  queryKey: string[];
  onSuccess?: {
    create?: (data: T) => void;
    update?: (data: T) => void;
    delete?: (id: string) => void;
  };
  messages?: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
  };
}

export interface UseCrudResult<T> {
  // Query results
  items: T[];
  item: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Mutations
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<void>;
  createMany: (items: Partial<T>[]) => Promise<T[]>;
  deleteMany: (ids: string[]) => Promise<void>;
  
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Refetch
  refetch: () => void;
}

export function createCrudHook<T extends { id: string }>(
  api: BaseApi<T>,
  options: CrudHookOptions<T>
) {
  return function useCrud(
    queryOptions?: QueryOptions,
    reactQueryOptions?: UseQueryOptions<T[]>
  ): UseCrudResult<T> {
    const queryClient = useQueryClient();
    const { queryKey, onSuccess, messages } = options;
    
    // Build query key with options
    const fullQueryKey = [...queryKey, queryOptions || {}];
    
    // Fetch items query
    const {
      data: items = [],
      isLoading,
      isError,
      error,
      refetch
    } = useQuery({
      queryKey: fullQueryKey,
      queryFn: async () => {
        const response = await api.findMany(queryOptions);
        if (response.error) throw response.error;
        return response.data || [];
      },
      ...reactQueryOptions
    });
    
    // Create mutation
    const createMutation = useMutation({
      mutationFn: async (data: Partial<T>) => {
        const response = await api.create(data);
        if (response.error) throw response.error;
        return response.data!;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey });
        handleApiSuccess(messages?.createSuccess || 'Created successfully');
        onSuccess?.create?.(data);
      },
      onError: (error) => {
        handleApiError(error, 'create');
      }
    });
    
    // Update mutation
    const updateMutation = useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
        const response = await api.update(id, data);
        if (response.error) throw response.error;
        return response.data!;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey });
        handleApiSuccess(messages?.updateSuccess || 'Updated successfully');
        onSuccess?.update?.(data);
      },
      onError: (error) => {
        handleApiError(error, 'update');
      }
    });
    
    // Delete mutation
    const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
        const response = await api.delete(id);
        if (response.error) throw response.error;
      },
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey });
        handleApiSuccess(messages?.deleteSuccess || 'Deleted successfully');
        onSuccess?.delete?.(id);
      },
      onError: (error) => {
        handleApiError(error, 'delete');
      }
    });
    
    // Batch create mutation
    const createManyMutation = useMutation({
      mutationFn: async (items: Partial<T>[]) => {
        const response = await api.createMany(items);
        if (response.error) throw response.error;
        return response.data || [];
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        handleApiSuccess('Items created successfully');
      },
      onError: (error) => {
        handleApiError(error, 'batch create');
      }
    });
    
    // Batch delete mutation
    const deleteManyMutation = useMutation({
      mutationFn: async (ids: string[]) => {
        const response = await api.deleteMany(ids);
        if (response.error) throw response.error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        handleApiSuccess('Items deleted successfully');
      },
      onError: (error) => {
        handleApiError(error, 'batch delete');
      }
    });
    
    return {
      // Query results
      items,
      item: null, // Can be extended for single item queries
      isLoading,
      isError,
      error: error as Error | null,
      
      // Mutations
      create: async (data: Partial<T>) => {
        try {
          return await createMutation.mutateAsync(data);
        } catch {
          return null;
        }
      },
      update: async (id: string, data: Partial<T>) => {
        try {
          return await updateMutation.mutateAsync({ id, data });
        } catch {
          return null;
        }
      },
      delete: async (id: string) => {
        await deleteMutation.mutateAsync(id);
      },
      createMany: async (items: Partial<T>[]) => {
        try {
          return await createManyMutation.mutateAsync(items);
        } catch {
          return [];
        }
      },
      deleteMany: async (ids: string[]) => {
        await deleteManyMutation.mutateAsync(ids);
      },
      
      // Loading states
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      
      // Refetch
      refetch
    };
  };
}

// Hook for single item queries
export function createItemHook<T extends { id: string }>(
  api: BaseApi<T>,
  queryKey: string[]
) {
  return function useItem(id: string | undefined) {
    const {
      data: item = null,
      isLoading,
      isError,
      error
    } = useQuery({
      queryKey: [...queryKey, id],
      queryFn: async () => {
        if (!id) return null;
        const response = await api.findById(id);
        if (response.error) throw response.error;
        return response.data;
      },
      enabled: !!id
    });
    
    return {
      item,
      isLoading,
      isError,
      error: error as Error | null
    };
  };
}