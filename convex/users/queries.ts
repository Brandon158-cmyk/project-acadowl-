import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

// Get the current user's profile and linked data
// Returns null if unauthenticated (safe for auth pages)
export const me = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Not authenticated - return null instead of throwing
    }

    // Get user from database to find their school
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null; // No user record yet - return null
    }

    if (!user.isActive) {
      return null; // Deactivated user - return null
    }

    const schoolId = user.schoolId;

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
  },
});

export const listForSchoolAdmin = query({
  args: {
    role: v.optional(v.string()),
    search: v.optional(v.string()),
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_USERS);

      if (!schoolId) {
        return [];
      }

      const users = await ctx.db
        .query('users')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      const normalizedSearch = args.search?.trim().toLowerCase();
      const includeInactive = args.includeInactive ?? false;
      const limit = args.limit ?? 100;

      const filtered = users
        .filter((user) => (args.role ? user.role === args.role : true))
        .filter((user) => (includeInactive ? true : user.isActive))
        .filter((user) => {
          if (!normalizedSearch) return true;

          const haystack = [
            user.name,
            user.email ?? '',
            user.phone ?? '',
            user.role,
          ].join(' ').toLowerCase();

          return haystack.includes(normalizedSearch);
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      return Promise.all(
        filtered.map(async (user) => {
          const linkedStaff = user.staffId ? await ctx.db.get(user.staffId) : null;
          const linkedGuardian = user.guardianId ? await ctx.db.get(user.guardianId) : null;
          const linkedStudent = user.studentId ? await ctx.db.get(user.studentId) : null;

          const linkedProfile = linkedStaff
            ? {
              type: 'staff' as const,
              id: linkedStaff._id,
              label: `${linkedStaff.firstName} ${linkedStaff.lastName}`,
            }
            : linkedGuardian
              ? {
                type: 'guardian' as const,
                id: linkedGuardian._id,
                label: `${linkedGuardian.firstName} ${linkedGuardian.lastName}`,
              }
              : linkedStudent
                ? {
                  type: 'student' as const,
                  id: linkedStudent._id,
                  label: `${linkedStudent.firstName} ${linkedStudent.lastName}`,
                }
                : null;

          return {
            ...user,
            linkedProfile,
          };
        }),
      );
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

// Get user by token identifier (used by actions internally)
export const getByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .unique();
  },
});

// List users by school (platform admin only)
export const listBySchool = query({
  args: { schoolId: v.id('schools') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const caller = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!caller || caller.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can list users by school');
    }

    return ctx.db
      .query('users')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
  },
});

