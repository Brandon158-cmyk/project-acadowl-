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

      const config = school.mobileMoneyConfig;
      return {
        airtelEnabled: config?.airtel?.isActive ?? false,
        airtelMerchantCode: config?.airtel?.merchantCode ?? '',
        airtelMerchantName: config?.airtel?.merchantName ?? '',
        airtelClientId: config?.airtel?.apiClientId ?? '',
        mtnEnabled: config?.mtn?.isActive ?? false,
        mtnMerchantCode: config?.mtn?.merchantCode ?? '',
        mtnApiUser: config?.mtn?.apiUserId ?? '',
        mtnSubscriptionKey: (config?.mtn as any)?.subscriptionKey ?? '',
        paymentInstructions: (config as any)?.paymentInstructions ?? '',
      };
    });
  },
});

export const updateMobileMoneyConfig = mutation({
  args: {
    // Flat fields from frontend
    airtelEnabled: v.optional(v.boolean()),
    airtelMerchantCode: v.optional(v.string()),
    airtelClientId: v.optional(v.string()),
    airtelClientSecret: v.optional(v.string()),
    mtnEnabled: v.optional(v.boolean()),
    mtnMerchantCode: v.optional(v.string()),
    mtnApiUser: v.optional(v.string()),
    mtnApiKey: v.optional(v.string()),
    mtnSubscriptionKey: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
    // Legacy nested fields
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
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existing = school.mobileMoneyConfig ?? {};

      // Build from flat fields if provided, otherwise use nested
      let airtelConfig = args.airtel ?? existing.airtel;
      if (args.airtelEnabled !== undefined || args.airtelMerchantCode !== undefined) {
        airtelConfig = {
          merchantCode: args.airtelMerchantCode ?? existing.airtel?.merchantCode ?? '',
          merchantName: existing.airtel?.merchantName ?? '',
          apiClientId: args.airtelClientId ?? existing.airtel?.apiClientId ?? '',
          apiSecret: args.airtelClientSecret ?? existing.airtel?.apiSecret ?? '',
          isActive: args.airtelEnabled ?? existing.airtel?.isActive ?? false,
        };
      }

      let mtnConfig = args.mtn ?? existing.mtn;
      if (args.mtnEnabled !== undefined || args.mtnMerchantCode !== undefined) {
        mtnConfig = {
          merchantCode: args.mtnMerchantCode ?? existing.mtn?.merchantCode ?? '',
          apiUserId: args.mtnApiUser ?? existing.mtn?.apiUserId ?? '',
          apiKey: args.mtnApiKey ?? existing.mtn?.apiKey ?? '',
          subscriptionKey: args.mtnSubscriptionKey ?? (existing.mtn as any)?.subscriptionKey ?? '',
          callbackHost: (existing.mtn as any)?.callbackHost ?? '',
          isActive: args.mtnEnabled ?? existing.mtn?.isActive ?? false,
        };
      }

      const updated = {
        ...existing,
        ...(airtelConfig && { airtel: airtelConfig }),
        ...(mtnConfig && { mtn: mtnConfig }),
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
