import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { internal } from '../_generated/api';
import { Role } from '../schema';

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
    const authDomain = process.env.AUTH_DOMAIN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authDomain || !supabaseUrl || !serviceRoleKey) {
      throw new Error('INTERNAL: Missing Supabase service role configuration');
    }

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

