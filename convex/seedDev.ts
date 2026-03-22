import { v } from 'convex/values';
import { internalMutation, query, mutation } from './_generated/server';
import { ConvexError } from 'convex/values';
import type { Doc } from './_generated/dataModel';

// ════════════════════════════════════════════════════════════════════════
// DEV UTILITIES — Only for development/testing, disable in production
// ════════════════════════════════════════════════════════════════════════

/**
 * Claim a seeded user by email — updates the user's tokenIdentifier
 * to match your current Supabase JWT, effectively logging you in as that user.
 *
 * Run via: pnpm convex run seedDev:claimUser -- '{"email":"admin@kabulonga.edu.zm"}'
 */
export const claimUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Get current auth identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('UNAUTHENTICATED: No valid session. Log in via Supabase first.');
    }

    // Find the seeded user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (!user) {
      throw new ConvexError(`User with email "${email}" not found. Check the seeded emails.`);
    }

    // Check if already claimed by someone else
    if (!user.tokenIdentifier.startsWith('seed|') && user.tokenIdentifier !== identity.tokenIdentifier) {
      throw new ConvexError('User already claimed by another account');
    }

    // Update the user's tokenIdentifier to match current auth
    await ctx.db.patch(user._id, {
      tokenIdentifier: identity.tokenIdentifier,
      supabaseId: identity.subject, // Supabase user ID from JWT
      isFirstLogin: false,
      lastLoginAt: Date.now(),
    });

    return {
      status: 'success',
      message: `Claimed user: ${user.name} (${user.role})`,
      userId: user._id,
      schoolId: user.schoolId,
    };
  },
});

/**
 * List all seeded users available to claim
 * Run via: pnpm convex run seedDev:listSeedUsers
 */
export const listSeedUsers = query({
  args: { schoolSlug: v.optional(v.string()) },
  handler: async (ctx, { schoolSlug }) => {
    let schoolId: string | undefined;

    if (schoolSlug) {
      const school = await ctx.db
        .query('schools')
        .withIndex('by_slug', (q) => q.eq('slug', schoolSlug))
        .unique();
      if (school) schoolId = school._id;
    }

    const users: Doc<'users'>[] = [];
    if (schoolId) {
      const schoolUsers = await ctx.db
        .query('users')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId as any))
        .collect();
      users.push(...schoolUsers);
    } else {
      // Get first school
      const schools = await ctx.db.query('schools').take(1);
      if (schools.length > 0) {
        const schoolUsers = await ctx.db
          .query('users')
          .withIndex('by_school', (q) => q.eq('schoolId', schools[0]._id))
          .collect();
        users.push(...schoolUsers);
      }
    }

    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isSeeded: u.tokenIdentifier.startsWith('seed|'),
      schoolId: u.schoolId,
    }));
  },
});

/**
 * Quick claim for common roles — finds an available user with the given role
 * and claims it for the current authenticated user.
 *
 * Run via: pnpm convex run seedDev:quickClaim -- '{"role":"school_admin"}'
 */
export const quickClaim = mutation({
  args: {
    role: v.union(
      v.literal('platform_admin'),
      v.literal('school_admin'),
      v.literal('deputy_head'),
      v.literal('bursar'),
      v.literal('teacher'),
      v.literal('guardian'),
      v.literal('student')
    ),
    schoolSlug: v.optional(v.string()),
  },
  handler: async (ctx, { role, schoolSlug }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('UNAUTHENTICATED: No valid session. Log in via Supabase first.');
    }

    let schoolId: string | undefined;
    if (schoolSlug) {
      const school = await ctx.db
        .query('schools')
        .withIndex('by_slug', (q) => q.eq('slug', schoolSlug))
        .unique();
      if (school) schoolId = school._id;
    }

    // Find an unclaimed user with this role
    let query = ctx.db.query('users').withIndex('by_role', (q) => q.eq('role', role));
    if (schoolId) {
      query = query.filter((q) => q.eq(q.field('schoolId'), schoolId as any));
    }

    const users = await query.take(10);
    const availableUser = users.find((u) => u.tokenIdentifier.startsWith('seed|'));

    if (!availableUser) {
      throw new ConvexError(`No available ${role} users to claim. Try a different role or school.`);
    }

    // Claim this user
    await ctx.db.patch(availableUser._id, {
      tokenIdentifier: identity.tokenIdentifier,
      supabaseId: identity.subject,
      isFirstLogin: false,
      lastLoginAt: Date.now(),
    });

    return {
      status: 'success',
      message: `Claimed ${role}: ${availableUser.name} (${availableUser.email})`,
      userId: availableUser._id,
      email: availableUser.email,
      schoolId: availableUser.schoolId,
    };
  },
});

/**
 * Reset a user back to seeded state (unclaim) — useful for switching accounts
 * Run via: pnpm convex run seedDev:resetUser -- '{"email":"admin@kabulonga.edu.zm"}'
 */
export const resetUser = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (!user) {
      throw new ConvexError(`User with email "${email}" not found`);
    }

    // Reset to a fresh seed token
    await ctx.db.patch(user._id, {
      tokenIdentifier: `seed|reset-${Date.now()}`,
      supabaseId: undefined,
      isFirstLogin: true,
      lastLoginAt: undefined,
    });

    return { status: 'success', message: `Reset user: ${user.name}` };
  },
});

/**
 * Get your current auth identity info — useful for debugging
 * Run via: pnpm convex run seedDev:whoami
 */
export const whoami = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { authenticated: false, message: 'No active session' };
    }

    // Look up user in database
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    return {
      authenticated: true,
      tokenIdentifier: identity.tokenIdentifier,
      supabaseUserId: identity.subject,
      issuer: identity.issuer,
      userFound: !!user,
      user: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
          }
        : null,
    };
  },
});
