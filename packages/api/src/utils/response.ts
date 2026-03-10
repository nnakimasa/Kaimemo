import type { FastifyReply } from 'fastify';
import { success, error as apiError } from '@kaimemo/shared';
import type { ApiMeta } from '@kaimemo/shared';

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  reply: FastifyReply,
  data: T,
  meta?: ApiMeta,
  statusCode = 200
) => {
  return reply.status(statusCode).send(success(data, meta));
};

/**
 * Send an error response
 */
export const sendError = (
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) => {
  return reply.status(statusCode).send(apiError(code, message, details));
};

/**
 * Common error responses
 */
export const errors = {
  notFound: (reply: FastifyReply, resource: string) =>
    sendError(reply, `${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found`, 404),

  unauthorized: (reply: FastifyReply) =>
    sendError(reply, 'AUTH_UNAUTHORIZED', 'Unauthorized', 401),

  forbidden: (reply: FastifyReply) =>
    sendError(reply, 'AUTH_FORBIDDEN', 'Access denied', 403),

  validation: (reply: FastifyReply, details: unknown) =>
    sendError(reply, 'VALIDATION_ERROR', 'Validation failed', 400, details),

  internal: (reply: FastifyReply) =>
    sendError(reply, 'INTERNAL_ERROR', 'Internal server error', 500),
};
