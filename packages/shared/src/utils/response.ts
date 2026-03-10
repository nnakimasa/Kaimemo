import type { ApiResponse, ApiError, ApiMeta } from '../types/api';

/**
 * Create a success response
 */
export const success = <T>(data: T, meta?: ApiMeta): ApiResponse<T> => ({
  data,
  error: null,
  meta,
});

/**
 * Create an error response
 */
export const error = (
  code: string,
  message: string,
  details?: unknown
): ApiResponse<null> => ({
  data: null,
  error: { code, message, details },
});

/**
 * Create an API error object
 */
export const createError = (
  code: string,
  message: string,
  details?: unknown
): ApiError => ({
  code,
  message,
  details,
});

/**
 * Check if response is an error
 */
export const isErrorResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { error: ApiError; data: null } => {
  return response.error !== null;
};

/**
 * Check if response is successful
 */
export const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { error: null; data: T } => {
  return response.error === null && response.data !== null;
};
