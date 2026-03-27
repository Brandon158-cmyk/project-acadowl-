import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from '../schools/_helpers';
import {
  canSeeAttendance,
  getGuardianForUser,
  requireLinkedStudentAccess,
} from './_helpers';

export const getAttendanceForGuardian = query({
  args: {
    studentId: v.id('students'),
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);
      const student = await ctx.db.get(args.studentId);

      if (!student || student.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Student was not found.');
      }

      const link = requireLinkedStudentAccess(student, guardian._id);
      if (!canSeeAttendance(link)) {
        return {
          forbidden: true,
          records: [],
          events: [],
          term: null,
        };
      }

      const [school, allAttendance, events] = await Promise.all([
        ctx.db.get(scopedSchoolId),
        ctx.db
          .query('attendance')
          .withIndex('by_student_date', (q) => q.eq('studentId', student._id))
          .collect(),
        ctx.db
          .query('schoolEvents')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
      ]);

      const activeTermId = args.termId ?? school?.currentTermId;
      const term = activeTermId ? await ctx.db.get(activeTermId) : null;

      const records = allAttendance
        .filter((entry) => (activeTermId ? entry.termId === activeTermId : true))
        .sort((a, b) => b.date.localeCompare(a.date));

      const filteredEvents = events
        .filter((event) => event.visibleToParents)
        .filter((event) => {
          if (!term) return true;
          return event.startDate >= new Date(term.startDate).toISOString().slice(0, 10)
            && event.endDate <= new Date(term.endDate).toISOString().slice(0, 10);
        });

      return {
        forbidden: false,
        records,
        events: filteredEvents,
        term,
      };
    });
  },
});
