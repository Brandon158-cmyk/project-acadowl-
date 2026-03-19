import { ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

interface SchoolScope {
  schoolId: Id<'schools'> | null;
  userId: Id<'users'>;
  role: string;
}

// Wraps a query/mutation handler with school-scoped context
// Ensures every database operation is filtered by schoolId
export async function withSchoolScope<T>(
  ctx: QueryCtx | MutationCtx,
  handler: (scope: SchoolScope) => Promise<T>,
): Promise<T> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('UNAUTHENTICATED: No valid session');
  }

  // Get user from database to find their school
  const user = await ctx.db
    .query('users')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new ConvexError('UNAUTHENTICATED: User not found');
  }

  if (!user.isActive) {
    throw new ConvexError('FORBIDDEN: User account is deactivated');
  }

  // Platform admins can operate without a schoolId
  if (user.role === 'platform_admin') {
    return handler({
      schoolId: null,
      userId: user._id,
      role: user.role,
    });
  }

  if (!user.schoolId) {
    throw new ConvexError('FORBIDDEN: User not assigned to a school');
  }

  return handler({
    schoolId: user.schoolId,
    userId: user._id,
    role: user.role,
  });
}

// Get authenticated user and their school context
export async function getAuthenticatedUserAndSchool(
  ctx: QueryCtx | MutationCtx,
): Promise<SchoolScope & { user: Doc<'users'> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError('UNAUTHENTICATED: No valid session');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!user) {
    throw new ConvexError('UNAUTHENTICATED: User not found');
  }

  if (!user.isActive) {
    throw new ConvexError('FORBIDDEN: User account is deactivated');
  }

  return {
    user,
    schoolId: user.schoolId ?? null,
    userId: user._id,
    role: user.role,
  };
}
