import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from '../schools/_helpers';
import {
  canSeeResults,
  getGuardianForUser,
  requireLinkedStudentAccess,
} from './_helpers';

export const getResultsForGuardian = query({
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
      if (!canSeeResults(link)) {
        return {
          forbidden: true,
          released: false,
          rows: [],
          summary: null,
        };
      }

      const [allResults, subjects, sessions] = await Promise.all([
        ctx.db
          .query('examResults')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .collect(),
        ctx.db
          .query('subjects')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
        ctx.db
          .query('examSessions')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
      ]);

      const subjectMap = new Map(subjects.map((subject) => [subject._id, subject]));
      const sessionMap = new Map(sessions.map((session) => [session._id, session]));

      const rows = allResults
        .filter((result) => {
          if (!args.termId) return true;
          const session = sessionMap.get(result.examSessionId);
          return session?.termId === args.termId;
        })
        .map((result) => ({
          id: result._id,
          subject: subjectMap.get(result.subjectId)?.name ?? 'Subject',
          grade: result.grade ?? '-',
          percent: Math.round((result.marksObtained / result.maxMarks) * 100),
          sessionName: sessionMap.get(result.examSessionId)?.name ?? 'Exam',
        }))
        .sort((a, b) => b.percent - a.percent);

      const averagePercent = rows.length > 0
        ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length)
        : null;

      return {
        forbidden: false,
        released: rows.length > 0,
        rows,
        summary: {
          averagePercent,
          totalSubjects: rows.length,
        },
      };
    });
  },
});
