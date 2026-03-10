/**
 * Standard API error structure
 */
export interface ApiError {
  code: string; // e.g., "LIST_NOT_FOUND", "AUTH_INVALID_TOKEN"
  message: string;
  details?: unknown;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

/**
 * Pagination metadata
 */
export interface ApiMeta {
  cursor?: string;
  hasMore?: boolean;
  total?: number;
}

/**
 * Pagination input parameters
 */
export interface PaginationInput {
  cursor?: string;
  limit?: number;
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Auth errors
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // User errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // List errors
  LIST_NOT_FOUND: 'LIST_NOT_FOUND',
  LIST_ACCESS_DENIED: 'LIST_ACCESS_DENIED',
  LIST_LIMIT_EXCEEDED: 'LIST_LIMIT_EXCEEDED',

  // Item errors
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',

  // Group errors
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  GROUP_ACCESS_DENIED: 'GROUP_ACCESS_DENIED',
  GROUP_LIMIT_EXCEEDED: 'GROUP_LIMIT_EXCEEDED',
  INVITE_INVALID: 'INVITE_INVALID',
  INVITE_EXPIRED: 'INVITE_EXPIRED',
  ALREADY_MEMBER: 'ALREADY_MEMBER',

  // Plan errors
  PLAN_REQUIRED: 'PLAN_REQUIRED',
  FEATURE_LIMIT_EXCEEDED: 'FEATURE_LIMIT_EXCEEDED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
