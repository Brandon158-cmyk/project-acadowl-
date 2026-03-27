import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { internal } from '../_generated/api';
import { canDo, Permission } from '../_lib/permissions';
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

function getSupabaseAdminConfig() {
  const authDomain = process.env.AUTH_DOMAIN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authDomain || !supabaseUrl || !serviceRoleKey) {
    throw new Error('INTERNAL: Missing Supabase service role configuration');
  }

  return {
    authDomain,
    supabaseUrl,
    serviceRoleKey,
  };
}

function extractSupabaseUuid(value?: string) {
  if (!value) return null;

  const candidate = value.includes('|') ? value.split('|')[1] : value;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(candidate) ? candidate : null;
}

function extractSupabaseUserIdFromAdminResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const direct = extractSupabaseUuid(typeof record.id === 'string' ? record.id : undefined);
  if (direct) return direct;

  const nested = record.user;
  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    return extractSupabaseUuid(typeof nestedRecord.id === 'string' ? nestedRecord.id : undefined);
  }

  return null;
}

// Admin-create a user in Supabase + Convex (platform admin only)
// Uses Supabase Admin API via service role key
export const adminCreateUser: ReturnType<typeof action> = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: Role,
    schoolId: v.id('schools'),
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify caller is platform_admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('UNAUTHENTICATED');

    const callerUser = await ctx.runQuery(api.users.queries.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!callerUser || callerUser.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can create users');
    }

    // 2. Create user in Supabase via Admin API
    const { authDomain, supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

    const supabaseResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email: args.email,
        password: args.tempPassword,
        email_confirm: true,
        user_metadata: {
          role: args.role,
          name: args.name,
        },
      }),
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      throw new Error(`Failed to create Supabase user: ${errorBody}`);
    }

    const supabaseUser = await supabaseResponse.json();
    const supabaseId = supabaseUser.id as string;
    const tokenIdentifier = `${authDomain}|${supabaseId}`;

    // 3. Create Convex user record
    const userId = await ctx.runMutation(internal.users.mutations.createUserFromAdmin, {
      tokenIdentifier,
      supabaseId,
      email: args.email,
      phone: args.phone,
      name: args.name,
      role: args.role,
      schoolId: args.schoolId,
    });

    return { userId, supabaseId };
  },
});

export const schoolAdminCreateUser: ReturnType<typeof action> = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: SchoolManagedRole,
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('UNAUTHENTICATED');

    const callerUser = await ctx.runQuery(api.users.queries.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!callerUser || !callerUser.schoolId || !canDo(callerUser.role, Permission.MANAGE_USERS)) {
      throw new Error('FORBIDDEN: Missing permission to manage users');
    }

    const { authDomain, supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

    const supabaseResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email: args.email,
        password: args.tempPassword,
        email_confirm: true,
        user_metadata: {
          role: args.role,
          name: args.name,
        },
      }),
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      throw new Error(`Failed to create Supabase user: ${errorBody}`);
    }

    const supabaseUser = await supabaseResponse.json();
    const supabaseId = supabaseUser.id as string;
    const tokenIdentifier = `${authDomain}|${supabaseId}`;

    const userId = await ctx.runMutation(internal.users.mutations.createUserFromAdmin, {
      tokenIdentifier,
      supabaseId,
      email: args.email,
      phone: args.phone,
      name: args.name,
      role: args.role,
      schoolId: callerUser.schoolId,
    });

    return { userId, supabaseId, schoolId: callerUser.schoolId };
  },
});

export const schoolAdminResetUserPassword: ReturnType<typeof action> = action({
  args: {
    userId: v.id('users'),
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('UNAUTHENTICATED');

    const callerUser = await ctx.runQuery(api.users.queries.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!callerUser || !callerUser.schoolId || !canDo(callerUser.role, Permission.MANAGE_USERS)) {
      throw new Error('FORBIDDEN: Missing permission to manage users');
    }

    const targetUser = await ctx.runQuery(api.users.queries.get, {
      id: args.userId,
    });

    if (!targetUser || targetUser.schoolId !== callerUser.schoolId) {
      throw new Error('NOT_FOUND: User was not found in your school scope');
    }

    const { authDomain, supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

    let supabaseUserId = extractSupabaseUuid(targetUser.supabaseId)
      ?? extractSupabaseUuid(targetUser.tokenIdentifier);
    let wasProvisioned = false;

    if (!supabaseUserId) {
      if (!targetUser.email) {
        throw new Error('VALIDATION: Seeded user has no email, so Supabase login cannot be provisioned automatically');
      }

      const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          email: targetUser.email,
          password: args.tempPassword,
          email_confirm: true,
          user_metadata: {
            role: targetUser.role,
            name: targetUser.name,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        throw new Error(`Failed to provision Supabase account for seeded user: ${errorBody}`);
      }

      const createPayload = await createResponse.json();
      const createdUserId = extractSupabaseUserIdFromAdminResponse(createPayload);
      if (!createdUserId) {
        throw new Error('INTERNAL: Could not determine Supabase user id for seeded user provisioning');
      }

      supabaseUserId = createdUserId;
      wasProvisioned = true;

      await ctx.runMutation(internal.users.mutations.linkSupabaseIdentity, {
        userId: targetUser._id,
        supabaseId: createdUserId,
        tokenIdentifier: `${authDomain}|${createdUserId}`,
        email: targetUser.email,
      });
    }

    if (!wasProvisioned) {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${supabaseUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          password: args.tempPassword,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to reset Supabase password: ${errorBody}`);
      }
    }

    await ctx.runMutation(internal.users.mutations.markPasswordResetRequired, {
      userId: targetUser._id,
    });

    return {
      success: true,
      userId: targetUser._id,
      email: targetUser.email,
      wasProvisioned,
    };
  },
});

