import type {
  ApiResponse,
  List,
  ListWithCount,
  Item,
  Group,
  GroupWithMembers,
} from '@kaimemo/shared';

// In production (S3+CloudFront), use VITE_API_URL. In dev, use Vite proxy via '/api'.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const hasBody = options?.body !== undefined;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...options,
  });

  return response.json();
}

// Lists API
export const listsApi = {
  getAll: () => fetchApi<ListWithCount[]>('/lists'),

  getById: (id: string) => fetchApi<List & { items: Item[] }>(`/lists/${id}`),

  create: (data: { name: string; description?: string; groupId?: string }) =>
    fetchApi<List>('/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<List>) =>
    fetchApi<List>(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/lists/${id}`, {
      method: 'DELETE',
    }),
};

// Items API
export const itemsApi = {
  getByList: (listId: string) => fetchApi<Item[]>(`/lists/${listId}/items`),

  create: (listId: string, data: { name: string; quantity?: number }) =>
    fetchApi<Item>(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Item>) =>
    fetchApi<Item>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/items/${id}`, {
      method: 'DELETE',
    }),
};

// Groups API
export const groupsApi = {
  getAll: () =>
    fetchApi<(Group & { role: string; memberCount: number })[]>('/groups'),

  getById: (id: string) => fetchApi<GroupWithMembers>(`/groups/${id}`),

  create: (data: { name: string; description?: string }) =>
    fetchApi<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    fetchApi<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/groups/${id}`, {
      method: 'DELETE',
    }),

  generateInvite: (id: string) =>
    fetchApi<{ code: string; expiresAt: string }>(`/groups/${id}/invite`, {
      method: 'POST',
    }),

  join: (code: string) =>
    fetchApi<{ groupId: string; alreadyMember: boolean }>(`/groups/join/${code}`, {
      method: 'POST',
    }),

  removeMember: (groupId: string, userId: string) =>
    fetchApi<{ removed: boolean }>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updateMemberRole: (groupId: string, userId: string, role: string) =>
    fetchApi<{ role: string }>(`/groups/${groupId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};
