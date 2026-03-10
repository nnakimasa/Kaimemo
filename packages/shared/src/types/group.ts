import type { BaseEntity } from './base';
import type { UserPublic } from './user';

/**
 * Member roles in a group
 */
export type MemberRole = 'owner' | 'editor' | 'viewer';

/**
 * Group entity
 */
export interface Group extends BaseEntity {
  name: string;
  description: string | null;
  ownerId: string;
  inviteCode: string | null;
  inviteExpiresAt: string | null;
}

/**
 * Group membership entity
 */
export interface GroupMember extends BaseEntity {
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

/**
 * Group member with user info
 */
export interface GroupMemberWithUser extends GroupMember {
  user: UserPublic;
}

/**
 * Group with members (for UI display)
 */
export interface GroupWithMembers extends Group {
  members: GroupMemberWithUser[];
  memberCount: number;
}

/**
 * Create group input
 */
export interface CreateGroupInput {
  name: string;
  description?: string | null;
}

/**
 * Update group input
 */
export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
}

/**
 * Invite link response
 */
export interface InviteLink {
  code: string;
  expiresAt: string;
  url: string;
}

/**
 * Accept invite input
 */
export interface AcceptInviteInput {
  code: string;
}

/**
 * Update member role input
 */
export interface UpdateMemberRoleInput {
  role: MemberRole;
}
