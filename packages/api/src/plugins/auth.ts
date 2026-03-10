import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from '../config.js';
import { errors } from '../utils/response.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

type CognitoVerifier = ReturnType<typeof CognitoJwtVerifier.create>;

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const isCognitoConfigured = !!(config.cognito.userPoolId && config.cognito.clientId);
  let verifier: CognitoVerifier | null = null;

  if (isCognitoConfigured) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: config.cognito.userPoolId,
      tokenUse: 'access',
      clientId: config.cognito.clientId,
    });
  }

  fastify.decorate(
    'verifyToken',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Dev fallback: use mock user when Cognito is not configured
      if (!verifier) {
        if (config.isDev) {
          const mockUser = await fastify.prisma.user.findUnique({
            where: { id: 'mock-user-id' },
          });
          if (mockUser) {
            request.user = {
              id: mockUser.id,
              email: mockUser.email,
              displayName: mockUser.displayName,
            };
            return;
          }
        }
        return errors.unauthorized(reply);
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return errors.unauthorized(reply);
      }

      const token = authHeader.slice(7);
      try {
        const payload = await verifier.verify(token);
        const cognitoId = payload.sub;
        const email = (payload['email'] as string) || '';
        const name =
          (payload['name'] as string) ||
          (payload['cognito:username'] as string) ||
          email.split('@')[0];

        // Auto-create or update user in DB on first login
        const user = await fastify.prisma.user.upsert({
          where: { cognitoId },
          update: { email, displayName: name },
          create: { cognitoId, email, displayName: name },
        });

        request.user = {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        };
      } catch {
        return errors.unauthorized(reply);
      }
    }
  );
});

export default authPlugin;
