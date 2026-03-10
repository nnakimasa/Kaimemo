import type { BaseEntity, SyncStatus } from './base';
import type { UserPublic } from './user';

/**
 * Item priority levels
 */
export type ItemPriority = 'low' | 'medium' | 'high';

/**
 * Shopping list item entity
 */
export interface Item extends BaseEntity {
  listId: string;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
  isChecked: boolean;
  checkedAt: string | null;
  checkedBy: string | null;
  assigneeId: string | null;
  priority: ItemPriority;
  sortOrder: number;
  category: string | null;
}

/**
 * Item with sync status (for mobile offline support)
 */
export interface ItemWithSync extends Item {
  syncStatus: SyncStatus;
  localUpdatedAt: number;
}

/**
 * Item with assignee info (for UI display)
 */
export interface ItemWithAssignee extends Item {
  assignee: UserPublic | null;
  checkedByUser: UserPublic | null;
}

/**
 * Create item input
 */
export interface CreateItemInput {
  name: string;
  quantity?: number;
  unit?: string | null;
  note?: string | null;
  assigneeId?: string | null;
  priority?: ItemPriority;
  category?: string | null;
}

/**
 * Update item input
 */
export interface UpdateItemInput {
  name?: string;
  quantity?: number;
  unit?: string | null;
  note?: string | null;
  isChecked?: boolean;
  assigneeId?: string | null;
  priority?: ItemPriority;
  sortOrder?: number;
  category?: string | null;
}

/**
 * Batch update items input (for reordering)
 */
export interface BatchUpdateItemsInput {
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
}
