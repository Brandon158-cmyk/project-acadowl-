import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';
import { SchoolType, Feature, SubscriptionTier } from '../schema';

// Create a new school (platform admin only)
export const createSchool = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    type: SchoolType,
    enabledFeatures: v.array(Feature),
    subscriptionTier: SubscriptionTier,
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('UNAUTHENTICATED');

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== 'platform_admin') {
      throw new Error('FORBIDDEN: Only platform admins can create schools');
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (existing) {
      throw new Error('CONFLICT: A school with this slug already exists');
    }

    const schoolId = await ctx.db.insert('schools', {
      name: args.name,
      slug: args.slug,
      type: args.type,
      enabledFeatures: args.enabledFeatures,
      subscriptionTier: args.subscriptionTier,
      province: args.province,
      district: args.district,
      email: args.email,
      phone: args.phone,
      isActive: true,
      onboardingComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
    });

    return schoolId;
  },
});

// Update school settings (school admin only)
export const updateSchool = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    province: v.optional(v.string()),
    district: v.optional(v.string()),
    eczCenterNumber: v.optional(v.string()),
    zraTpin: v.optional(v.string()),
    gradingMode: v.optional(v.union(v.literal('ecz'), v.literal('gpa'), v.literal('custom'))),
    academicMode: v.optional(v.union(v.literal('term'), v.literal('semester'))),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      if (!schoolId) throw new Error('FORBIDDEN: No school context');

      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (args.name !== undefined) updates.name = args.name;
      if (args.phone !== undefined) updates.phone = args.phone;
      if (args.email !== undefined) updates.email = args.email;
      if (args.website !== undefined) updates.website = args.website;
      if (args.address !== undefined) updates.address = args.address;
      if (args.province !== undefined) updates.province = args.province;
      if (args.district !== undefined) updates.district = args.district;
      if (args.eczCenterNumber !== undefined) updates.eczCenterNumber = args.eczCenterNumber;
      if (args.zraTpin !== undefined) updates.zraTpin = args.zraTpin;
      if (args.gradingMode !== undefined) updates.gradingMode = args.gradingMode;
      if (args.academicMode !== undefined) updates.academicMode = args.academicMode;

      await ctx.db.patch(schoolId, updates);
      return { success: true };
    });
  },
});

// Update school settings (ZRA, payment config, etc.)
export const updateSchoolSettings = mutation({
  args: {
    zraTpin: v.optional(v.string()),
    zraVsdSerial: v.optional(v.string()),
    zraBranchCode: v.optional(v.string()),
    zraEnabled: v.optional(v.boolean()),
    zraMockMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      if (!schoolId) throw new Error('FORBIDDEN: No school context');

      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (args.zraTpin !== undefined) updates.zraTpin = args.zraTpin;
      if (args.zraVsdSerial !== undefined) updates.zraVsdcSerial = args.zraVsdSerial;
      if (args.zraBranchCode !== undefined) updates.zraBranchCode = args.zraBranchCode;

      await ctx.db.patch(schoolId, updates);
      return { success: true };
    });
  },
});

// Update school branding (school admin only)
export const updateBranding = mutation({
  args: {
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    motto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      if (!schoolId) throw new Error('FORBIDDEN: No school context');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('NOT_FOUND: School not found');

      const branding = {
        ...(school.branding ?? {}),
        ...Object.fromEntries(
          Object.entries(args).filter(([, val]) => val !== undefined),
        ),
      };

      await ctx.db.patch(schoolId, { branding, updatedAt: Date.now() });
      return { success: true };
    });
  },
});

// Update enabled features (school admin only)
export const updateEnabledFeatures = mutation({
  args: {
    enabledFeatures: v.array(Feature),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      if (!schoolId) throw new Error('FORBIDDEN: No school context');

      await ctx.db.patch(schoolId, {
        enabledFeatures: args.enabledFeatures,
        updatedAt: Date.now(),
      });
      return { success: true };
    });
  },
});
