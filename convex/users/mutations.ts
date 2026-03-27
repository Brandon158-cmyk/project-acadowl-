import { v } from 'convex/values';
import { mutation, internalMutation, type MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { withSchoolScope } from '../_lib/schoolContext';
import { Permission, requirePermission } from '../_lib/permissions';
import { Role } from '../schema';

const SchoolManagedRole = v.union(
  v.literal('school_admin'),
  v.literal('deputy_head'),
  v.literal('bursar'),
  v.literal('teacher'),
  v.literal('class_teacher'),
  v.literal('matron'),
  v.literal('librarian'),
  v.literal('driver'),
  v.literal('guardian'),
  v.literal('student'),
);

// Resolve user profile after Supabase login
// Creates or updates the user document based on Supabase identity
export const resolveUserProfile = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('UNAUTHENTICATED: No valid session');
    }

    // Find existing user by token identifier
    let user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    // Extract Supabase user ID from tokenIdentifier
    const supabaseId = identity.tokenIdentifier.split('|')[1];

    if (!user) {
      // First login - create user record
      const userId = await ctx.db.insert('users', {
        tokenIdentifier: identity.tokenIdentifier,
        supabaseId,
        email: identity.email || undefined,
        phone: identity.phoneNumber || undefined,
        name: identity.name || identity.email || 'User',
        role: 'guardian', // Safe default - admin will assign correct role
        schoolId: undefined,
        isActive: true,
        isFirstLogin: true,
        notifPrefs: {
          sms: true,
          whatsapp: false,
          email: false,
          inApp: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      // Existing user - update last login
      await ctx.db.patch(user._id, {
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Auto-link to staff/guardian/student profile by phone or email
    if (user && !user.staffId && !user.guardianId && !user.studentId) {
      await autoLinkProfile(ctx, user);
    }

    return user;
  },
});

export const setUserActiveStatus = mutation({
  args: {
    userId: v.id('users'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.MANAGE_USERS);

      if (!schoolId) {
        throw new Error('FORBIDDEN: Missing school scope');
      }

      const target = await ctx.db.get(args.userId);
      if (!target || target.schoolId !== schoolId) {
        throw new Error('NOT_FOUND: User was not found in your school scope');
      }

      if (target.role === 'platform_admin') {
        throw new Error('FORBIDDEN: Platform admins cannot be modified here');
      }

      if (target._id === userId && !args.isActive) {
        throw new Error('VALIDATION: You cannot deactivate your own account');
      }

      await ctx.db.patch(target._id, {
        isActive: args.isActive,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const updateUserRoleInSchool = mutation({
  args: {
    userId: v.id('users'),
    role: SchoolManagedRole,
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_USERS);

      if (!schoolId) {
        throw new Error('FORBIDDEN: Missing school scope');
      }

      const target = await ctx.db.get(args.userId);
      if (!target || target.schoolId !== schoolId) {
        throw new Error('NOT_FOUND: User was not found in your school scope');
      }

      if (target.role === 'platform_admin') {
        throw new Error('FORBIDDEN: Platform admins cannot be modified here');
      }

      await ctx.db.patch(target._id, {
        role: args.role,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const markPasswordResetRequired = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isFirstLogin: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Auto-link user to staff, guardian, or student profile
async function autoLinkProfile(ctx: MutationCtx, user: Doc<'users'>) {
  const schoolId = user.schoolId;
  if (!schoolId) return;

  // Check staff by email
  if (user.email) {
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_email', (q) => q.eq('schoolId', schoolId).eq('email', user.email!))
      .unique();
    if (staff) {
      await ctx.db.patch(user._id, { staffId: staff._id });
      return;
    }
  }

  // Check staff by phone
  if (user.phone) {
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_phone', (q) => q.eq('schoolId', schoolId).eq('phone', user.phone!))
      .unique();
    if (staff) {
      await ctx.db.patch(user._id, { staffId: staff._id });
      return;
    }

    // Check guardians by phone
    const guardian = await ctx.db
      .query('guardians')
      .withIndex('by_phone', (q) => q.eq('schoolId', schoolId).eq('phone', user.phone!))
      .unique();
    if (guardian) {
      await ctx.db.patch(user._id, { guardianId: guardian._id });
      return;
    }
  }

  // Check students by email (less common - for older students with portal access)
  if (user.email) {
    const student = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
      .filter((q) => q.eq(q.field('email'), user.email))
      .unique();
    if (student) {
      await ctx.db.patch(user._id, { studentId: student._id });
    }
  }
}

// Create a user from admin (server-side only, uses Supabase Admin API)
// This is called from an action that creates the Supabase auth user first
export const createUserFromAdmin = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    supabaseId: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.string(),
    role: Role,
    schoolId: v.optional(v.id('schools')),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      tokenIdentifier: args.tokenIdentifier,
      supabaseId: args.supabaseId,
      email: args.email,
      phone: args.phone,
      name: args.name,
      role: args.role,
      schoolId: args.schoolId,
      isActive: true,
      isFirstLogin: true,
      notifPrefs: {
        sms: true,
        whatsapp: false,
        email: false,
        inApp: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Create a platform admin (invite-key gated)
export const createPlatformAdmin = mutation({
  args: {
    supabaseId: v.string(),
    name: v.string(),
    email: v.string(),
    inviteKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('UNAUTHENTICATED: No valid session');
    }

    // Validate invite key server-side
    const validKey = process.env.PLATFORM_ADMIN_INVITE_KEY;
    if (!validKey || args.inviteKey !== validKey) {
      throw new Error('FORBIDDEN: Invalid invite key');
    }

    const tokenIdentifier = identity.tokenIdentifier;
    const identitySupabaseId = tokenIdentifier.split('|')[1];

    if (!identitySupabaseId || identitySupabaseId !== args.supabaseId) {
      throw new Error('FORBIDDEN: Authenticated user does not match signup user');
    }

    // Check if user already exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', tokenIdentifier))
      .unique();

    if (existing) {
      throw new Error('CONFLICT: User already exists');
    }

    const userId = await ctx.db.insert('users', {
      tokenIdentifier,
      supabaseId: identitySupabaseId,
      email: args.email,
      name: args.name,
      role: 'platform_admin',
      isActive: true,
      isFirstLogin: false,
      notifPrefs: {
        sms: false,
        whatsapp: false,
        email: true,
        inApp: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    await ctx.db.insert('platformAdmins', {
      userId,
      email: args.email,
      name: args.name,
      isSuperAdmin: false,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile (self-service)
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    notifPrefs: v.optional(
      v.object({
        sms: v.boolean(),
        whatsapp: v.boolean(),
        email: v.boolean(),
        inApp: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      const updates: Record<string, unknown> = {
        updatedAt: Date.now(),
      };

      if (args.name !== undefined) updates.name = args.name;
      if (args.notifPrefs !== undefined) updates.notifPrefs = args.notifPrefs;

      await ctx.db.patch(userId, updates);
      return { success: true };
    });
  },
});

// Mark first login complete (shown welcome/onboarding)
export const completeFirstLogin = mutation({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      await ctx.db.patch(userId, {
        isFirstLogin: false,
        updatedAt: Date.now(),
      });
      return { success: true };
    });
  },
});
