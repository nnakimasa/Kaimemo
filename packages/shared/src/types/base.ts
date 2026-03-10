/**
 * Base entity interface for all database entities
 */
export interface BaseEntity {
  id: string; // UUID v4
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Sync status for offline-first entities
 */
export type SyncStatus = 'synced' | 'pending' | 'conflict';
