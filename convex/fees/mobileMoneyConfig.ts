import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getMobileMoneyConfig = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;
      const school = await ctx.db.get(schoolId);
      if (!school) return null;
      return school.mobileMoneyConfig ?? null;
    });
  },
});

export const updateMobileMoneyConfig = mutation({
  args: {
    airtel: v.optional(
      v.object({
        merchantCode: v.string(),
        merchantName: v.string(),
        apiClientId: v.string(),
        apiSecret: v.string(),
        isActive: v.boolean(),
      }),
    ),
    mtn: v.optional(
      v.object({
        merchantCode: v.string(),
        apiUserId: v.string(),
        apiKey: v.string(),
        subscriptionKey: v.string(),
        callbackHost: v.string(),
        isActive: v.boolean(),
      }),
    ),
    paymentReferenceFormat: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existing = school.mobileMoneyConfig ?? {};
      const updated = {
        ...existing,
        ...(args.airtel !== undefined && { airtel: args.airtel }),
        ...(args.mtn !== undefined && { mtn: args.mtn }),
        ...(args.paymentReferenceFormat !== undefined && {
          paymentReferenceFormat: args.paymentReferenceFormat,
        }),
        ...(args.paymentInstructions !== undefined && {
          paymentInstructions: args.paymentInstructions,
        }),
      };

      await ctx.db.patch(schoolId, {
        mobileMoneyConfig: updated,
        updatedAt: Date.now(),
      });
    });
  },
});
