import type { FastifyPluginAsync } from 'fastify';
import { sendSuccess } from '../utils/response.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /auth/me - Get current authenticated user
  fastify.get(
    '/auth/me',
    { preHandler: [fastify.verifyToken] },
    async (request, reply) => {
      return sendSuccess(reply, request.user);
    }
  );
};

export default authRoutes;
