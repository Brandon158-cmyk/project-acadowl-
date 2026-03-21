import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { withSchoolScope } from './_lib/schoolContext';
import { throwError } from './_lib/errors';
import { ensureSchoolId } from './schools/_helpers';

const notificationTypeValidator = v.union(
  v.literal('attendance'),
  v.literal('fees'),
  v.literal('results'),
  v.literal('general'),
  v.literal('emergency'),
);

export const createNotification = internalMutation({
  args: {
    schoolId: v.id('schools'),
    recipientUserId: v.optional(v.id('users')),
    recipientPhone: v.optional(v.string()),
    type: notificationTypeValidator,
    channel: v.optional(v.union(v.literal('in_app'), v.literal('sms'))),
    subject: v.optional(v.string()),
    body: v.string(),
    link: v.optional(v.string()),
    status: v.optional(v.union(v.literal('queued'), v.literal('sent'), v.literal('delivered'), v.literal('failed'))),
    provider: v.optional(v.union(v.literal('airtel'), v.literal('mtn'))),
    providerMessageId: v.optional(v.string()),
    providerResponse: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    nextRetryAt: v.optional(v.number()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const channel = args.channel ?? (args.recipientPhone ? 'sms' : 'in_app');

    if (channel === 'in_app' && !args.recipientUserId) {
      throwError('VALIDATION', 'recipientUserId is required for in-app notifications.');
    }

    if (channel === 'sms' && !args.recipientPhone) {
      throwError('VALIDATION', 'recipientPhone is required for SMS notifications.');
    }

    const notificationId = await ctx.db.insert('notifications', {
      schoolId: args.schoolId,
      userId: args.recipientUserId,
      recipientPhone: args.recipientPhone,
      type: args.type,
      channel,
      title: args.subject ?? 'Notification',
      body: args.body,
      link: args.link,
      isRead: false,
      status: args.status ?? (channel === 'sms' ? 'queued' : 'delivered'),
      provider: args.provider,
      providerMessageId: args.providerMessageId,
      providerResponse: args.providerResponse,
      retryCount: args.retryCount ?? 0,
      nextRetryAt: args.nextRetryAt,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

export const updateDeliveryStatus = internalMutation({
  args: {
    notificationId: v.id('notifications'),
    status: v.union(v.literal('queued'), v.literal('sent'), v.literal('delivered'), v.literal('failed')),
    provider: v.optional(v.union(v.literal('airtel'), v.literal('mtn'))),
    providerMessageId: v.optional(v.string()),
    providerResponse: v.optional(v.string()),
    retryCountDelta: v.optional(v.number()),
    nextRetryAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throwError('NOT_FOUND', 'Notification was not found.');
    }

    await ctx.db.patch(args.notificationId, {
      status: args.status,
      provider: args.provider ?? notification.provider,
      providerMessageId: args.providerMessageId ?? notification.providerMessageId,
      providerResponse: args.providerResponse ?? notification.providerResponse,
      retryCount: (notification.retryCount ?? 0) + (args.retryCountDelta ?? 0),
      nextRetryAt: args.nextRetryAt,
    });

    return { success: true };
  },
});

export const getUnreadCount = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      const unread = await ctx.db
        .query('notifications')
        .withIndex('by_user_unread', (q) => q.eq('userId', userId).eq('isRead', false))
        .collect();

      return unread.length;
    });
  },
});

export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const notifications = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      const sorted = notifications
        .filter((notification) => notification.schoolId === scopedSchoolId)
        .sort((a, b) => b.createdAt - a.createdAt);

      return sorted.slice(0, args.limit ?? 25);
    });
  },
});

export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const notification = await ctx.db.get(args.notificationId);

      if (!notification) {
        throwError('NOT_FOUND', 'Notification was not found.');
      }

      if (notification.userId !== userId || notification.schoolId !== scopedSchoolId) {
        throwError('FORBIDDEN', 'You cannot update this notification.');
      }

      if (!notification.isRead) {
        await ctx.db.patch(args.notificationId, { isRead: true });
      }

      return { success: true };
    });
  },
});

export const markAllAsRead = mutation({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const notifications = await ctx.db
        .query('notifications')
        .withIndex('by_user_unread', (q) => q.eq('userId', userId).eq('isRead', false))
        .collect();

      const scopedNotifications = notifications.filter((notification) => notification.schoolId === scopedSchoolId);
      await Promise.all(
        scopedNotifications.map((notification) =>
          ctx.db.patch(notification._id, { isRead: true }),
        ),
      );

      return { updatedCount: scopedNotifications.length };
    });
  },
});
