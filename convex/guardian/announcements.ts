import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { getGuardianForUser, getGuardianLinkedStudents } from './_helpers';

export const getAnnouncementsForGuardian = query({
  args: {
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);
      const linkedStudents = await getGuardianLinkedStudents(ctx, scopedSchoolId, guardian._id);
      const gradeIds = new Set(linkedStudents.map((student) => student.currentGradeId).filter(Boolean));

      const records = await ctx.db
        .query('announcements')
        .withIndex('by_school_published', (q) => q.eq('schoolId', scopedSchoolId).eq('isPublished', true))
        .collect();

      const now = Date.now();
      const filtered = records
        .filter((record) => !record.expiresAt || record.expiresAt > now)
        .filter((record) => {
          if (record.targetAudience === 'all' || record.targetAudience === 'parents_only') {
            return true;
          }

          if (record.targetAudience === 'boarding_parents') {
            return linkedStudents.some((student) => student.boardingStatus === 'boarder');
          }

          return false;
        })
        .filter((record) => {
          if (!record.targetGradeIds || record.targetGradeIds.length === 0) {
            return true;
          }

          return record.targetGradeIds.some((gradeId) => gradeIds.has(gradeId));
        })
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
          }
          return (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt);
        });

      const limit = args.limit ?? 20;
      const start = args.cursor ?? 0;
      const items = filtered.slice(start, start + limit);
      const nextCursor = start + limit < filtered.length ? start + limit : null;

      return {
        items,
        nextCursor,
      };
    });
  },
});
