import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../services/api';

export function useCreateItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number }) => {
      const response = await itemsApi.create(listId, data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', listId] });
    },
  });
}

export function useToggleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      listId,
      isChecked,
    }: {
      id: string;
      listId: string;
      isChecked: boolean;
    }) => {
      const response = await itemsApi.update(id, { isChecked });
      if (response.error) throw new Error(response.error.message);
      return { ...response.data, listId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists', data?.listId] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, listId, ...data }: {
      id: string; listId: string;
      name?: string; quantity?: number; unit?: string | null; note?: string | null;
    }) => {
      const response = await itemsApi.update(id, data);
      if (response.error) throw new Error(response.error.message);
      return { ...response.data, listId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists', data?.listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, listId }: { id: string; listId: string }) => {
      const response = await itemsApi.delete(id);
      if (response.error) throw new Error(response.error.message);
      return { ...response.data, listId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lists', variables.listId] });
    },
  });
}
