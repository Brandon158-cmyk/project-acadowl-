import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

// Get school settings for the current school (used by settings pages)
export const getSchoolSettings = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;

      const school = await ctx.db.get(schoolId);
      if (!school) return null;

      return {
        // ZRA fields
        zraTpin: school.zraTpin ?? '',
        zraVsdSerial: (school as any).zraVsdcSerial ?? '',
        zraBranchCode: (school as any).zraBranchCode ?? '',
        zraEnabled: !!(school as any).zraVsdcSerial,
        zraMockMode: !(school as any).zraVsdcSerial,

        // Mobile money config (flattened for payment settings page)
        airtelEnabled: school.mobileMoneyConfig?.airtel?.isActive ?? false,
        airtelMerchantCode: school.mobileMoneyConfig?.airtel?.merchantCode ?? '',
        airtelClientId: school.mobileMoneyConfig?.airtel?.apiClientId ?? '',
        mtnEnabled: school.mobileMoneyConfig?.mtn?.isActive ?? false,
        mtnMerchantCode: school.mobileMoneyConfig?.mtn?.merchantCode ?? '',
        mtnApiUser: school.mobileMoneyConfig?.mtn?.apiUserId ?? '',
        mtnSubscriptionKey: (school.mobileMoneyConfig?.mtn as any)?.subscriptionKey ?? '',
        paymentInstructions: (school as any).paymentInstructions ?? '',

        // Arrears policy
        arrearsPolicy: (school as any).arrearsPolicy ?? null,

        // General
        name: school.name,
        slug: school.slug,
        type: school.type,
      };
    });
  },
});

// Get a school by its slug (used for subdomain resolution)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const school = await ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!school || !school.isActive) return null;

    return school;
  },
});

// Get a school by ID
export const getById = query({
  args: { id: v.id('schools') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// List all active schools (platform admin only)
export const listActive = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can list schools');
    }

    return ctx.db
      .query('schools')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
  },
});

// List ALL schools — active and inactive (platform admin only)
export const listAll = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can list schools');
    }

    return ctx.db.query('schools').collect();
  },
});
