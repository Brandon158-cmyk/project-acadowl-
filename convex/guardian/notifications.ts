import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { getGuardianForUser } from './_helpers';

const typeFilter = v.union(
  v.literal('attendance'),
  v.literal('fees'),
  v.literal('results'),
  v.literal('general'),
  v.literal('emergency'),
  v.literal('message'),
  v.literal('announcement'),
);

export const getNotificationsForGuardian = query({
  args: {
    type: v.optional(typeFilter),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      await getGuardianForUser(ctx, scopedSchoolId, userId);

      const all = await ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect();

      const filtered = all
        .filter((item) => item.schoolId === scopedSchoolId)
        .filter((item) => (args.type ? item.type === args.type : true))
        .filter((item) => (args.startDate ? item.createdAt >= args.startDate : true))
        .filter((item) => (args.endDate ? item.createdAt <= args.endDate : true))
        .sort((a, b) => b.createdAt - a.createdAt);

      const start = args.cursor ?? 0;
      const limit = args.limit ?? 30;
      const items = filtered.slice(start, start + limit);
      const nextCursor = start + limit < filtered.length ? start + limit : null;

      return {
        items,
        nextCursor,
      };
    });
  },
});

export const markAllNotificationsAsRead = mutation({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      await getGuardianForUser(ctx, scopedSchoolId, userId);

      const unread = await ctx.db
        .query('notifications')
        .withIndex('by_user_unread', (q) => q.eq('userId', userId).eq('isRead', false))
        .collect();

      const scopedUnread = unread.filter((item) => item.schoolId === scopedSchoolId);
      await Promise.all(scopedUnread.map((item) => ctx.db.patch(item._id, { isRead: true })));

      return { updated: scopedUnread.length };
    });
  },
});
