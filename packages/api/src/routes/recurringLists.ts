import type { FastifyPluginAsync } from 'fastify';
import { sendSuccess, errors } from '../utils/response.js';
import { calcNextGenerationDate } from '../utils/recurring.js';

const recurringListsRoutes: FastifyPluginAsync = async (fastify) => {
  const authOpts = { preHandler: [fastify.verifyToken] };

  // GET /recurring-lists
  fastify.get('/recurring-lists', authOpts, async (request, reply) => {
    const userGroupIds = (
      await fastify.prisma.groupMember.findMany({
        where: { userId: request.user.id },
        select: { groupId: true },
      })
    ).map((m) => m.groupId);

    const lists = await fastify.prisma.recurringList.findMany({
      where: {
        OR: [
          { ownerId: request.user.id },
          { groupId: { in: userGroupIds } },
        ],
      },
      include: {
        _count: { select: { items: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(reply, lists.map(({ _count, ...l }) => ({ ...l, itemCount: _count.items })));
  });

  // POST /recurring-lists
  fastify.post('/recurring-lists', authOpts, async (request, reply) => {
    const { name, groupId } = request.body as { name: string; groupId?: string | null };
    if (!name?.trim()) return errors.validation(reply, { name: 'required' });

    const list = await fastify.prisma.recurringList.create({
      data: { name: name.trim(), ownerId: request.user.id, groupId: groupId ?? null },
      include: { _count: { select: { items: true } }, group: { select: { id: true, name: true } } },
    });

    const { _count, ...rest } = list;
    return sendSuccess(reply, { ...rest, itemCount: _count.items }, undefined, 201);
  });

  // GET /recurring-lists/:id
  fastify.get('/recurring-lists/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const list = await fastify.prisma.recurringList.findUnique({
      where: { id },
      include: {
        items: { orderBy: [{ sortOrder: 'asc' }] },
        group: { select: { id: true, name: true } },
      },
    });
    if (!list) return errors.notFound(reply, 'RecurringList');
    if (list.ownerId !== request.user.id) return errors.forbidden(reply);
    return sendSuccess(reply, list);
  });

  // PUT /recurring-lists/:id
  fastify.put('/recurring-lists/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      groupId?: string | null;
      sortOrder?: number;
      frequency?: string;
      weekday?: number;
      monthlyWeek?: number;
      daysBefore?: number;
      reminderTime?: string | null;
      isActive?: boolean;
    };

    const existing = await fastify.prisma.recurringList.findUnique({ where: { id } });
    if (!existing) return errors.notFound(reply, 'RecurringList');
    if (existing.ownerId !== request.user.id) return errors.forbidden(reply);

    // Recalculate nextGenerationAt if schedule fields changed
    const scheduleChanged = ['frequency', 'weekday', 'monthlyWeek', 'daysBefore'].some(
      (k) => body[k as keyof typeof body] !== undefined
    );

    const frequency = body.frequency ?? existing.frequency;
    const weekday = body.weekday ?? existing.weekday;
    const monthlyWeek = body.monthlyWeek ?? existing.monthlyWeek;
    const daysBefore = body.daysBefore ?? existing.daysBefore;

    const nextGenerationAt = scheduleChanged
      ? calcNextGenerationDate(frequency, weekday, monthlyWeek, daysBefore)
      : existing.nextGenerationAt;

    const list = await fastify.prisma.recurringList.update({
      where: { id },
      data: { ...body, ...(scheduleChanged ? { nextGenerationAt } : {}) },
      include: {
        _count: { select: { items: true } },
        group: { select: { id: true, name: true } },
      },
    });

    const { _count, ...rest } = list;
    return sendSuccess(reply, { ...rest, itemCount: _count.items });
  });

  // DELETE /recurring-lists/:id
  fastify.delete('/recurring-lists/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await fastify.prisma.recurringList.findUnique({ where: { id } });
    if (!existing) return errors.notFound(reply, 'RecurringList');
    if (existing.ownerId !== request.user.id) return errors.forbidden(reply);
    await fastify.prisma.recurringList.delete({ where: { id } });
    return sendSuccess(reply, { deleted: true });
  });

  // ─── Template Items ───

  // POST /recurring-lists/:id/items
  fastify.post('/recurring-lists/:id/items', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, quantity, unit } = request.body as { name: string; quantity?: number; unit?: string };
    if (!name?.trim()) return errors.validation(reply, { name: 'required' });

    const existing = await fastify.prisma.recurringList.findUnique({ where: { id } });
    if (!existing) return errors.notFound(reply, 'RecurringList');
    if (existing.ownerId !== request.user.id) return errors.forbidden(reply);

    const maxOrder = await fastify.prisma.recurringItem.aggregate({
      where: { recurringListId: id },
      _max: { sortOrder: true },
    });

    const item = await fastify.prisma.recurringItem.create({
      data: {
        recurringListId: id,
        name: name.trim(),
        quantity: quantity ?? 1,
        unit: unit ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return sendSuccess(reply, item, undefined, 201);
  });

  // DELETE /recurring-lists/:id/items/:itemId
  fastify.delete('/recurring-lists/:id/items/:itemId', authOpts, async (request, reply) => {
    const { id, itemId } = request.params as { id: string; itemId: string };
    const existing = await fastify.prisma.recurringList.findUnique({ where: { id } });
    if (!existing) return errors.notFound(reply, 'RecurringList');
    if (existing.ownerId !== request.user.id) return errors.forbidden(reply);

    await fastify.prisma.recurringItem.delete({ where: { id: itemId } });
    return sendSuccess(reply, { deleted: true });
  });

  // ─── Generate ───

  // POST /recurring-lists/:id/generate  - Manually generate a list now
  fastify.post('/recurring-lists/:id/generate', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const recurringList = await fastify.prisma.recurringList.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!recurringList) return errors.notFound(reply, 'RecurringList');
    if (recurringList.ownerId !== request.user.id) return errors.forbidden(reply);

    const newList = await generateList(fastify.prisma, recurringList);
    return sendSuccess(reply, { listId: newList.id }, undefined, 201);
  });
};

/**
 * Generate a new regular list from a recurring list template.
 * Called by the manual endpoint and the auto-cron.
 */
export async function generateList(
  prisma: any,
  recurringList: any
): Promise<any> {
  const list = await prisma.list.create({
    data: {
      name: recurringList.name,
      ownerId: recurringList.ownerId,
      groupId: recurringList.groupId ?? null,
      items: {
        create: (recurringList.items ?? []).map((item: any, idx: number) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit ?? null,
          sortOrder: item.sortOrder ?? idx,
        })),
      },
    },
  });

  const nextGen = calcNextGenerationDate(
    recurringList.frequency,
    recurringList.weekday,
    recurringList.monthlyWeek,
    recurringList.daysBefore,
    new Date()
  );

  await prisma.recurringList.update({
    where: { id: recurringList.id },
    data: { lastGeneratedAt: new Date(), nextGenerationAt: nextGen },
  });

  return list;
}

export default recurringListsRoutes;
