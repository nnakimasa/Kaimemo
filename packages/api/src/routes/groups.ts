import type { FastifyPluginAsync } from 'fastify';
import {
  createGroupSchema,
  updateGroupSchema,
  updateMemberRoleSchema,
} from '@kaimemo/shared';
import { sendSuccess, sendError, errors } from '../utils/response.js';
import { randomBytes } from 'crypto';

const groupsRoutes: FastifyPluginAsync = async (fastify) => {
  const authOpts = { preHandler: [fastify.verifyToken] };

  // GET /groups - Get all groups the user is a member of
  fastify.get('/groups', authOpts, async (request, reply) => {
    const memberships = await fastify.prisma.groupMember.findMany({
      where: { userId: request.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      role: m.role,
      memberCount: m.group._count.members,
    }));

    return sendSuccess(reply, groups);
  });

  // POST /groups - Create a group
  fastify.post('/groups', authOpts, async (request, reply) => {
    const parseResult = createGroupSchema.safeParse(request.body);
    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const { name, description } = parseResult.data;

    const group = await fastify.prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: {
          name,
          description: description ?? null,
          ownerId: request.user.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: request.user.id,
          role: 'owner',
        },
      });

      return g;
    });

    return sendSuccess(reply, group, undefined, 201);
  });

  // GET /groups/:id - Get group details with members
  fastify.get('/groups/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await fastify.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: request.user.id } },
    });

    if (!membership) {
      return errors.notFound(reply, 'Group');
    }

    const group = await fastify.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) {
      return errors.notFound(reply, 'Group');
    }

    return sendSuccess(reply, { ...group, memberCount: group.members.length });
  });

  // PUT /groups/:id - Update group (owner or editor)
  fastify.put('/groups/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = updateGroupSchema.safeParse(request.body);
    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const membership = await fastify.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: request.user.id } },
    });

    if (!membership || membership.role === 'viewer') {
      return errors.forbidden(reply);
    }

    const group = await fastify.prisma.group.update({
      where: { id },
      data: parseResult.data,
    });

    return sendSuccess(reply, group);
  });

  // DELETE /groups/:id - Delete group (owner only)
  fastify.delete('/groups/:id', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };

    const group = await fastify.prisma.group.findUnique({ where: { id } });
    if (!group) return errors.notFound(reply, 'Group');
    if (group.ownerId !== request.user.id) return errors.forbidden(reply);

    await fastify.prisma.group.delete({ where: { id } });
    return sendSuccess(reply, { deleted: true });
  });

  // POST /groups/:id/invite - Generate invite code (owner or editor)
  fastify.post('/groups/:id/invite', authOpts, async (request, reply) => {
    const { id } = request.params as { id: string };

    const membership = await fastify.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: request.user.id } },
    });

    if (!membership || membership.role === 'viewer') {
      return errors.forbidden(reply);
    }

    const code = randomBytes(6).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await fastify.prisma.group.update({
      where: { id },
      data: { inviteCode: code, inviteExpiresAt: expiresAt },
    });

    return sendSuccess(reply, {
      code,
      expiresAt: expiresAt.toISOString(),
    });
  });

  // POST /groups/join/:code - Join group by invite code
  fastify.post('/groups/join/:code', authOpts, async (request, reply) => {
    const { code } = request.params as { code: string };

    const group = await fastify.prisma.group.findUnique({
      where: { inviteCode: code },
    });

    if (!group) return errors.notFound(reply, 'Invite');

    if (!group.inviteExpiresAt || group.inviteExpiresAt < new Date()) {
      return sendError(
        reply,
        'INVITE_EXPIRED',
        '招待リンクの有効期限が切れています',
        410
      );
    }

    const existing = await fastify.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: request.user.id } },
    });

    if (existing) {
      return sendSuccess(reply, { groupId: group.id, alreadyMember: true });
    }

    await fastify.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: request.user.id,
        role: 'editor',
      },
    });

    return sendSuccess(reply, { groupId: group.id, alreadyMember: false }, undefined, 201);
  });

  // DELETE /groups/:id/members/:userId - Remove member (owner removes others, member removes self)
  fastify.delete('/groups/:id/members/:userId', authOpts, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    const requesterMembership = await fastify.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: request.user.id } },
    });

    if (!requesterMembership) return errors.forbidden(reply);
    if (userId !== request.user.id && requesterMembership.role !== 'owner') {
      return errors.forbidden(reply);
    }

    const group = await fastify.prisma.group.findUnique({ where: { id } });
    if (group?.ownerId === userId) {
      return sendError(reply, 'CANNOT_REMOVE_OWNER', 'オーナーは削除できません', 400);
    }

    await fastify.prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    });

    return sendSuccess(reply, { removed: true });
  });

  // PUT /groups/:id/members/:userId - Update member role (owner only)
  fastify.put('/groups/:id/members/:userId', authOpts, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const parseResult = updateMemberRoleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return errors.validation(reply, parseResult.error.flatten());
    }

    const group = await fastify.prisma.group.findUnique({ where: { id } });
    if (!group) return errors.notFound(reply, 'Group');
    if (group.ownerId !== request.user.id) return errors.forbidden(reply);

    const member = await fastify.prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId } },
      data: { role: parseResult.data.role },
    });

    return sendSuccess(reply, member);
  });
};

export default groupsRoutes;
