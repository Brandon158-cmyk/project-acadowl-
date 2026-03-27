import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';

export const getThreadsForUser = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const threads = await ctx.db
        .query('messageThreads')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const scopedThreads = threads
        .filter((thread) => thread.participantIds.includes(userId))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      const unread = await ctx.db
        .query('messageNotifications')
        .withIndex('by_user_unread', (q) => q.eq('userId', userId).eq('isRead', false))
        .collect();

      const unreadByThread = unread.reduce<Record<string, number>>((acc, item) => {
        acc[item.threadId] = (acc[item.threadId] ?? 0) + 1;
        return acc;
      }, {});

      const participants = await Promise.all(
        scopedThreads.map(async (thread) => {
          const otherUserId = thread.participantIds.find((id) => id !== userId) ?? null;
          const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
          return {
            threadId: thread._id,
            participant: otherUser
              ? {
                _id: otherUser._id,
                name: otherUser.name,
                avatarUrl: otherUser.avatarUrl ?? null,
                role: otherUser.role,
              }
              : null,
          };
        }),
      );

      const participantMap = new Map(
        participants.map((item) => [item.threadId, item.participant]),
      );

      return scopedThreads.map((thread) => ({
        ...thread,
        unreadCount: unreadByThread[thread._id] ?? 0,
        participant: participantMap.get(thread._id) ?? null,
      }));
    });
  },
});

export const getMessagesForThread = query({
  args: {
    threadId: v.id('messageThreads'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const thread = await ctx.db.get(args.threadId);

      if (!thread || thread.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Message thread was not found.');
      }

      if (!thread.participantIds.includes(userId)) {
        throwError('FORBIDDEN', 'You are not a participant in this thread.');
      }

      const messages = await ctx.db
        .query('messages')
        .withIndex('by_thread', (q) => q.eq('threadId', thread._id))
        .collect();

      const senderIds = [...new Set(messages.map((message) => message.senderId))];
      const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)));
      const senderMap = new Map(
        senders
          .filter((sender): sender is NonNullable<typeof sender> => Boolean(sender))
          .map((sender) => [sender._id, sender]),
      );

      return messages
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((message) => ({
          ...message,
          sender: senderMap.get(message.senderId)
            ? {
              _id: senderMap.get(message.senderId)!._id,
              name: senderMap.get(message.senderId)!.name,
              role: senderMap.get(message.senderId)!.role,
              avatarUrl: senderMap.get(message.senderId)!.avatarUrl ?? null,
            }
            : null,
        }));
    });
  },
});

export const markThreadAsRead = mutation({
  args: {
    threadId: v.id('messageThreads'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const thread = await ctx.db.get(args.threadId);

      if (!thread || thread.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Message thread was not found.');
      }

      if (!thread.participantIds.includes(userId)) {
        throwError('FORBIDDEN', 'You are not a participant in this thread.');
      }

      const unreadNotifications = await ctx.db
        .query('messageNotifications')
        .withIndex('by_user_unread', (q) => q.eq('userId', userId).eq('isRead', false))
        .collect();

      const target = unreadNotifications.filter((item) => item.threadId === thread._id);
      await Promise.all(target.map((item) => ctx.db.patch(item._id, { isRead: true })));

      const messages = await ctx.db
        .query('messages')
        .withIndex('by_thread', (q) => q.eq('threadId', thread._id))
        .collect();

      const now = Date.now();
      await Promise.all(
        messages.map(async (message) => {
          if (!message.readBy.some((entry) => entry.userId === userId)) {
            await ctx.db.patch(message._id, {
              readBy: [...message.readBy, { userId, readAt: now }],
            });
          }
        }),
      );

      return { updated: target.length };
    });
  },
});
