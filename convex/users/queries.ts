import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

// Get the current user's profile and linked data
export const me = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const user = await ctx.db.get(userId);
      if (!user) return null;

      // Load linked profile data
      let profile = null;
      if (user.staffId) {
        profile = await ctx.db.get(user.staffId);
      } else if (user.guardianId) {
        profile = await ctx.db.get(user.guardianId);
      } else if (user.studentId) {
        profile = await ctx.db.get(user.studentId);
      }

      // Load school data
      const school = schoolId ? await ctx.db.get(schoolId) : null;

      return {
        ...user,
        profile,
        school,
      };
    });
  },
});

// List users in the current school (admin only)
export const list = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_USERS);

      const limit = args.limit ?? 50;

      const results = schoolId
        ? ctx.db.query('users').withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        : ctx.db.query('users');

      const users = await results.take(limit);
      return users;
    });
  },
});

// Get a specific user by ID
export const get = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_USERS);

      const user = await ctx.db.get(args.id);
      if (!user) return null;

      // Ensure user belongs to the same school (unless platform admin)
      if (schoolId && user.schoolId !== schoolId) {
        throw new Error('FORBIDDEN: User belongs to different school');
      }

      return user;
    });
  },
});

