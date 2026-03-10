import type { FastifyPluginAsync } from 'fastify';
import { createListSchema, updateListSchema } from '@kaimemo/shared';
import { sendSuccess, errors } from '../utils/response.js';

const listsRoutes: FastifyPluginAsync = async (fastify) => {
  const authOpts = { preHandler: [fastify.verifyToken] };

  // GET /lists - Get all lists for current user
  fastify.get('/lists', authOpts, async (request, reply) => {
    const lists = await fastify.prisma.list.findMany({
      where: { ownerId: request.user.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const listsWithCount = lists.map((list) => ({
      ...list,
      itemCount: list._count.items,
      checkedCount: 0,
    }));

    return sendSuccess(reply, listsWithCount);
  });

  // POST /lists - Create a new list
  fastify.post('/lists', authOpts, async (request, reply) => {
    const parseResult = createListSchema.safeParse(request.body);

    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const { name, description, groupId } = parseResult.data;

    try {
      const list = await fastify.prisma.list.create({
        data: {
          name,
          description: description ?? null,
          groupId: groupId ?? null,
          ownerId: request.user.id,
        },
      });

      return sendSuccess(reply, list, undefined, 201);
    } catch {
      return errors.internal(reply);
    }
  });

  // GET /lists/:id - Get a specific list
  fastify.get('/lists/:id', authOpts, async (request, reply) => {
    const { id } = (request.params as { id: string });

    const list = await fastify.prisma.list.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ isChecked: 'asc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!list) {
      return errors.notFound(reply, 'List');
    }

    if (list.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    return sendSuccess(reply, list);
  });

  // PUT /lists/:id - Update a list
  fastify.put('/lists/:id', authOpts, async (request, reply) => {
    const { id } = (request.params as { id: string });
    const parseResult = updateListSchema.safeParse(request.body);

    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const existing = await fastify.prisma.list.findUnique({ where: { id } });

    if (!existing) {
      return errors.notFound(reply, 'List');
    }

    if (existing.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    const list = await fastify.prisma.list.update({
      where: { id },
      data: parseResult.data,
    });

    return sendSuccess(reply, list);
  });

  // DELETE /lists/:id - Delete a list
  fastify.delete('/lists/:id', authOpts, async (request, reply) => {
    const { id } = (request.params as { id: string });

    const existing = await fastify.prisma.list.findUnique({ where: { id } });

    if (!existing) {
      return errors.notFound(reply, 'List');
    }

    if (existing.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    await fastify.prisma.list.delete({ where: { id } });

    return sendSuccess(reply, { deleted: true });
  });
};

export default listsRoutes;
