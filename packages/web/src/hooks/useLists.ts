import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi } from '../services/api';

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const response = await listsApi.getAll();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
}

export function useList(id: string) {
  return useQuery({
    queryKey: ['lists', id],
    queryFn: async () => {
      const response = await listsApi.getById(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await listsApi.create(data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; groupId?: string | null; isArchived?: boolean; sortOrder?: number }) => {
      const response = await listsApi.update(id, data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await listsApi.delete(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
