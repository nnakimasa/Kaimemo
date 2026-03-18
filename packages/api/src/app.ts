import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import listsRoutes from './routes/lists.js';
import itemsRoutes from './routes/items.js';
import groupsRoutes from './routes/groups.js';
import shareTokensRoutes from './routes/shareTokens.js';
import recurringListsRoutes, { generateList } from './routes/recurringLists.js';

export const buildApp = async () => {
  const fastify = Fastify({
    logger: {
      level: config.isDev ? 'info' : 'warn',
      transport: config.isDev
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // Register plugins (order matters: prisma before auth)
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(listsRoutes);
  await fastify.register(itemsRoutes);
  await fastify.register(groupsRoutes);
  await fastify.register(shareTokensRoutes);
  await fastify.register(recurringListsRoutes);

  // Auto-generate recurring lists (check every hour)
  const runRecurringCheck = async () => {
    try {
      const prisma = (fastify as any).prisma;
      const due = await prisma.recurringList.findMany({
        where: {
          isActive: true,
          nextGenerationAt: { lte: new Date() },
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      for (const rl of due) {
        await generateList(prisma, rl);
        fastify.log.info(`Generated list from recurring: ${rl.name}`);
      }
    } catch (e) {
      fastify.log.error('Recurring list generation error:', e);
    }
  };

  fastify.addHook('onReady', async () => {
    await runRecurringCheck();
    setInterval(runRecurringCheck, 60 * 60 * 1000); // every hour
  });

  return fastify;
};
