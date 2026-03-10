import type { ApiResponse, List, ListWithCount, Item } from '@kaimemo/shared';

const API_BASE = '/api';

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

  create: (data: { name: string; description?: string }) =>
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
