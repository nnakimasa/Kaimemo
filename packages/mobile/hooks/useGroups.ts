import { useQuery } from '@tanstack/react-query';
import { groupsApi } from '../services/api';

export type GroupSummary = { id: string; name: string; description: string | null; role: string; memberCount: number };

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
