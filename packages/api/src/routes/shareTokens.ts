import type { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'crypto';
import { sendSuccess, errors } from '../utils/response.js';

const shareTokensRoutes: FastifyPluginAsync = async (fastify) => {
  const authOpts = { preHandler: [fastify.verifyToken] };

  // POST /lists/:id/share-token - Generate (or reuse) a share token for a list
  fastify.post('/lists/:id/share-token', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };

    const list = await fastify.prisma.list.findUnique({ where: { id } });
    if (!list) return errors.notFound(reply, 'List');
    if (list.ownerId !== request.user.id) return errors.forbidden(reply);

    // Check for existing token
    const existing = await fastify.prisma.listShareToken.findFirst({
      where: { listId: id },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return sendSuccess(reply, { token: existing.token });
    }

    const token = randomBytes(24).toString('base64url');
    const shareToken = await fastify.prisma.listShareToken.create({
      data: { listId: id, token, createdBy: request.user.id },
    });

    return sendSuccess(reply, { token: shareToken.token }, undefined, 201);
  });

  // GET /readonly/:token - Get list data via share token (no auth required)
  fastify.get('/readonly/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const shareToken = await fastify.prisma.listShareToken.findUnique({
      where: { token },
      include: {
        list: {
          include: {
            items: {
              orderBy: [{ isChecked: 'asc' }, { sortOrder: 'asc' }],
            },
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!shareToken) return errors.notFound(reply, 'ShareToken');

    const { list } = shareToken;
    const itemCount = list.items.length;
    const checkedCount = list.items.filter((i) => i.isChecked).length;

    return sendSuccess(reply, {
      list: {
        id: list.id,
        name: list.name,
        group: list.group,
        updatedAt: list.updatedAt,
        itemCount,
        checkedCount,
        items: list.items,
      },
    });
  });
};

export default shareTokensRoutes;
