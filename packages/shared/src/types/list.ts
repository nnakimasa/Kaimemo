import type { BaseEntity, SyncStatus } from './base';

/**
 * Shopping list entity
 */
export interface List extends BaseEntity {
  name: string;
  description: string | null;
  ownerId: string;
  groupId: string | null;
  isArchived: boolean;
  sortOrder: number;
}

/**
 * List with sync status (for mobile offline support)
 */
export interface ListWithSync extends List {
  syncStatus: SyncStatus;
  localUpdatedAt: number;
}

/**
 * List with item count (for list views)
 */
export interface ListWithCount extends List {
  itemCount: number;
  checkedCount: number;
}

/**
 * Create list input
 */
export interface CreateListInput {
  name: string;
  description?: string | null;
  groupId?: string | null;
}

/**
 * Update list input
 */
export interface UpdateListInput {
  name?: string;
  description?: string | null;
  groupId?: string | null;
  isArchived?: boolean;
  sortOrder?: number;
}
