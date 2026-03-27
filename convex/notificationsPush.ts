import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { withSchoolScope } from './_lib/schoolContext';
import { ensureSchoolId } from './schools/_helpers';

export const upsertPushSubscription = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const existing = await ctx.db
        .query('pushSubscriptions')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      const matched = existing.find((entry) => entry.endpoint === args.endpoint);
      if (matched) {
        await ctx.db.patch(matched._id, {
          p256dh: args.p256dh,
          auth: args.auth,
          userAgent: args.userAgent,
          isActive: true,
        });

        return { subscriptionId: matched._id, updated: true };
      }

      const subscriptionId = await ctx.db.insert('pushSubscriptions', {
        schoolId: scopedSchoolId,
        userId,
        endpoint: args.endpoint,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent,
        isActive: true,
        createdAt: Date.now(),
      });

      return { subscriptionId, updated: false };
    });
  },
});

export const disablePushSubscription = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      const existing = await ctx.db
        .query('pushSubscriptions')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      const matched = existing.find((entry) => entry.endpoint === args.endpoint);
      if (!matched) {
        return { success: true, updated: false };
      }

      await ctx.db.patch(matched._id, {
        isActive: false,
      });

      return { success: true, updated: true };
    });
  },
});

export const getMyPushSubscriptions = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      const all = await ctx.db
        .query('pushSubscriptions')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      return all.sort((a, b) => b.createdAt - a.createdAt);
    });
  },
});

export const sendPushNotification = internalMutation({
  args: {
    schoolId: v.id('schools'),
    userId: v.id('users'),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ sent: number; mocked?: boolean }> => {
    const subscriptions = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const activeSubscriptions = subscriptions.filter((entry) => entry.isActive && entry.schoolId === args.schoolId);

    if (activeSubscriptions.length === 0) {
      return { sent: 0 };
    }

    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.warn('[PUSH]', {
        userId: args.userId,
        title: args.title,
        body: args.body,
        url: args.url,
      });
      return { sent: activeSubscriptions.length, mocked: true };
    }

    return { sent: activeSubscriptions.length, mocked: false };
  },
});

export const getPushSubscriptionsForUserInternal = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query('pushSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    return records.filter((record) => record.isActive);
  },
});
