import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringApi } from '../services/api';
import type { RecurringListData } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export function useRecurringLists() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['recurring-lists'],
    queryFn: async () => {
      const res = await recurringApi.getAll();
      if (res.error) throw new Error(res.error.message);
      return res.data ?? [];
    },
    enabled: isAuthenticated,
  });
}

export function useRecurringList(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['recurring-lists', id],
    queryFn: async () => {
      const res = await recurringApi.getById(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    enabled: isAuthenticated && !!id,
  });
}

export function useCreateRecurringList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; groupId?: string | null }) => {
      const res = await recurringApi.create(data);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
}

export function useUpdateRecurringList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<RecurringListData>) => {
      const res = await recurringApi.update(id, data);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
}

export function useDeleteRecurringList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await recurringApi.delete(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists'] }),
  });
}

export function useAddRecurringItem(recurringListId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number; unit?: string }) => {
      const res = await recurringApi.addItem(recurringListId, data);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists', recurringListId] }),
  });
}

export function useDeleteRecurringItem(recurringListId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await recurringApi.deleteItem(recurringListId, itemId);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-lists', recurringListId] }),
  });
}

export function useGenerateRecurringList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await recurringApi.generate(id);
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-lists'] });
      qc.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}
