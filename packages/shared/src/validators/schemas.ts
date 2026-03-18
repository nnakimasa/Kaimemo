import { z } from 'zod';

// Base schemas
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// User schemas
export const planTypeSchema = z.enum(['free', 'premium']);
export const subscriptionStatusSchema = z.enum([
  'none',
  'active',
  'cancelled',
  'past_due',
]);

// List schemas
export const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  reminderAt: z.string().datetime().nullable().optional(),
});

// Item schemas
export const itemPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().max(20).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: itemPrioritySchema.default('medium'),
  category: z.string().max(50).nullable().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  quantity: z.number().int().min(1).optional(),
  unit: z.string().max(20).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  isChecked: z.boolean().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: itemPrioritySchema.optional(),
  sortOrder: z.number().int().optional(),
  category: z.string().max(50).nullable().optional(),
});

export const batchUpdateItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int(),
    })
  ),
});

// Group schemas
export const memberRoleSchema = z.enum(['owner', 'editor', 'viewer']);

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const acceptInviteSchema = z.object({
  code: z.string().min(1),
});

export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

// Type inference helpers - these are used internally for validation
// Use the types from @kaimemo/shared/types for TypeScript interfaces
export type CreateListSchemaType = z.infer<typeof createListSchema>;
export type UpdateListSchemaType = z.infer<typeof updateListSchema>;
export type CreateItemSchemaType = z.infer<typeof createItemSchema>;
export type UpdateItemSchemaType = z.infer<typeof updateItemSchema>;
export type BatchUpdateItemsSchemaType = z.infer<typeof batchUpdateItemsSchema>;
export type CreateGroupSchemaType = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchemaType = z.infer<typeof updateGroupSchema>;
export type AcceptInviteSchemaType = z.infer<typeof acceptInviteSchema>;
export type UpdateMemberRoleSchemaType = z.infer<typeof updateMemberRoleSchema>;
export type PaginationSchemaType = z.infer<typeof paginationSchema>;
