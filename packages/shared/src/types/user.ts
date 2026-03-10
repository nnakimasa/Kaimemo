import type { BaseEntity } from './base';

/**
 * User plan types
 */
export type PlanType = 'free' | 'premium';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';

/**
 * User entity
 */
export interface User extends BaseEntity {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  cognitoId: string;
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  subscriptionStartedAt: string | null;
  subscriptionExpiresAt: string | null;
}

/**
 * User without sensitive fields (for API responses)
 */
export type UserPublic = Pick<
  User,
  'id' | 'displayName' | 'avatarUrl' | 'createdAt'
>;

/**
 * Current user info (includes plan info)
 */
export type UserMe = Pick<
  User,
  | 'id'
  | 'email'
  | 'displayName'
  | 'avatarUrl'
  | 'planType'
  | 'subscriptionStatus'
  | 'createdAt'
>;
