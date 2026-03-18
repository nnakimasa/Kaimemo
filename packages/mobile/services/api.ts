import Constants from 'expo-constants';
import type { ApiResponse, List, ListWithCount, Item } from '@kaimemo/shared';

// Get API URL from Expo config or use default
const getApiBaseUrl = () => {
  if (__DEV__) {
    // hostUri is e.g. "192.168.x.x:8081" — extract IP to reach the API server
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:3000`;
    }
    return 'http://localhost:3000';
  }

  // In production, use the configured API URL
  return Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
};

const API_BASE = getApiBaseUrl();

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const hasBody = options?.body !== undefined;
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...options,
    });

    return response.json();
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
      },
    };
  }
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

// Recurring Lists API
export type RecurringListData = {
  id: string;
  name: string;
  group: { id: string; name: string } | null;
  frequency: string;
  weekday: number;
  monthlyWeek: number;
  daysBefore: number;
  reminderTime: string | null;
  nextGenerationAt: string | null;
  itemCount: number;
};

export const recurringApi = {
  getAll: () => fetchApi<RecurringListData[]>('/recurring-lists'),

  create: (data: { name: string }) =>
    fetchApi<RecurringListData>('/recurring-lists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<RecurringListData & { frequency: string; weekday: number; monthlyWeek: number; daysBefore: number; reminderTime: string | null }>) =>
    fetchApi<RecurringListData>(`/recurring-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/recurring-lists/${id}`, { method: 'DELETE' }),

  generate: (id: string) =>
    fetchApi<{ listId: string }>(`/recurring-lists/${id}/generate`, { method: 'POST' }),
};

// Share Token API
export const shareApi = {
  generateToken: (listId: string) =>
    fetchApi<{ token: string }>(`/lists/${listId}/share-token`, {
      method: 'POST',
    }),
};

// Groups API
export const groupsApi = {
  getAll: () => fetchApi<Array<{ id: string; name: string; description: string | null; role: string; memberCount: number }>>('/groups'),
};
