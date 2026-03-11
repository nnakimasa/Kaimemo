import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../services/api';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupsApi.getAll();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: async () => {
      const response = await groupsApi.getById(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await groupsApi.create(data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await groupsApi.delete(id);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useGenerateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await groupsApi.generateInvite(groupId);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await groupsApi.join(code);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const response = await groupsApi.removeMember(groupId, userId);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      role,
    }: {
      groupId: string;
      userId: string;
      role: string;
    }) => {
      const response = await groupsApi.updateMemberRole(groupId, userId, role);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
  });
}
