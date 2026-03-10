import type { FastifyPluginAsync } from 'fastify';
import { createItemSchema, updateItemSchema } from '@kaimemo/shared';
import { sendSuccess, errors } from '../utils/response.js';

const itemsRoutes: FastifyPluginAsync = async (fastify) => {
  const authOpts = { preHandler: [fastify.verifyToken] };

  // GET /lists/:listId/items - Get all items in a list
  fastify.get('/lists/:listId/items', authOpts, async (request, reply) => {
    const { listId } = (request.params as { listId: string });

    const list = await fastify.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return errors.notFound(reply, 'List');
    }

    if (list.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    const items = await fastify.prisma.item.findMany({
      where: { listId },
      orderBy: [{ isChecked: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(reply, items);
  });

  // POST /lists/:listId/items - Add an item to a list
  fastify.post('/lists/:listId/items', authOpts, async (request, reply) => {
    const { listId } = (request.params as { listId: string });
    const parseResult = createItemSchema.safeParse(request.body);

    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const list = await fastify.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return errors.notFound(reply, 'List');
    }

    if (list.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    const { name, quantity, unit, note, assigneeId, priority, category } =
      parseResult.data;

    const maxOrder = await fastify.prisma.item.aggregate({
      where: { listId },
      _max: { sortOrder: true },
    });

    const item = await fastify.prisma.item.create({
      data: {
        listId,
        name,
        quantity: quantity ?? 1,
        unit: unit ?? null,
        note: note ?? null,
        assigneeId: assigneeId ?? null,
        priority: priority ?? 'medium',
        category: category ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return sendSuccess(reply, item, undefined, 201);
  });

  // PUT /items/:id - Update an item
  fastify.put('/items/:id', authOpts, async (request, reply) => {
    const { id } = (request.params as { id: string });
    const parseResult = updateItemSchema.safeParse(request.body);

    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const existing = await fastify.prisma.item.findUnique({
      where: { id },
      include: { list: true },
    });

    if (!existing) {
      return errors.notFound(reply, 'Item');
    }

    if (existing.list.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    const updateData: Record<string, unknown> = { ...parseResult.data };

    if (parseResult.data.isChecked !== undefined) {
      if (parseResult.data.isChecked && !existing.isChecked) {
        updateData.checkedAt = new Date();
        updateData.checkedBy = request.user.id;
      } else if (!parseResult.data.isChecked && existing.isChecked) {
        updateData.checkedAt = null;
        updateData.checkedBy = null;
      }
    }

    const item = await fastify.prisma.item.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(reply, item);
  });

  // DELETE /items/:id - Delete an item
  fastify.delete('/items/:id', authOpts, async (request, reply) => {
    const { id } = (request.params as { id: string });

    const existing = await fastify.prisma.item.findUnique({
      where: { id },
      include: { list: true },
    });

    if (!existing) {
      return errors.notFound(reply, 'Item');
    }

    if (existing.list.ownerId !== request.user.id) {
      return errors.forbidden(reply);
    }

    await fastify.prisma.item.delete({ where: { id } });

    return sendSuccess(reply, { deleted: true });
  });
};

export default itemsRoutes;
