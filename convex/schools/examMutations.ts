import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId, ensureBelongsToSchool } from './_helpers';

const ExamType = v.union(
  v.literal('class_test'),
  v.literal('mid_term'),
  v.literal('end_of_term'),
  v.literal('mock'),
  v.literal('ecz_final'),
);

export const createExamSession = mutation({
  args: {
    name: v.string(),
    termId: v.id('terms'),
    type: ExamType,
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      // Verify term belongs to this school
      const term = await ctx.db.get(args.termId);
      if (!term) {
        throwError('NOT_FOUND', 'The selected term does not exist.');
      }

      // Verify the academic year belongs to this school
      const academicYear = await ctx.db.get(term.academicYearId);
      ensureBelongsToSchool(academicYear, scopedSchoolId, 'Academic Year');

      const now = Date.now();
      const sessionId = await ctx.db.insert('examSessions', {
        schoolId: scopedSchoolId,
        name: args.name.trim(),
        termId: args.termId,
        type: args.type,
        startDate: args.startDate,
        endDate: args.endDate,
        isLocked: false,
        createdAt: now,
        updatedAt: now,
      });

      return { sessionId };
    });
  },
});

export const toggleExamSessionLock = mutation({
  args: { sessionId: v.id('examSessions') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const session = await ctx.db.get(args.sessionId);
      if (!session || session.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Exam session not found.');
      }

      await ctx.db.patch(args.sessionId, {
        isLocked: !session.isLocked,
        updatedAt: Date.now(),
      });

      return { isLocked: !session.isLocked };
    });
  },
});

export const enterExamResults = mutation({
  args: {
    examSessionId: v.id('examSessions'),
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
    results: v.array(
      v.object({
        studentId: v.id('students'),
        marksObtained: v.number(),
        maxMarks: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);

      const session = await ctx.db.get(args.examSessionId);
      if (!session || session.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Exam session not found.');
      }
      if (session.isLocked) {
        throwError('FORBIDDEN', 'This exam session is locked. Results cannot be modified.');
      }

      // Get grading scales from school
      const school = await ctx.db.get(scopedSchoolId);
      const gradingScales = school?.gradingScales ?? [];

      const now = Date.now();
      let savedCount = 0;

      for (const result of args.results) {
        // Compute grade from percentage
        const percentage = (result.marksObtained / result.maxMarks) * 100;
        const matchedScale = gradingScales
          .sort((a, b) => b.minScore - a.minScore)
          .find((s) => percentage >= s.minScore && percentage <= s.maxScore);

        const grade = matchedScale?.gradeLabel ?? undefined;

        // Check for existing result
        const existingResults = await ctx.db
          .query('examResults')
          .withIndex('by_session_student', (q) =>
            q.eq('examSessionId', args.examSessionId).eq('studentId', result.studentId),
          )
          .collect();

        const existing = existingResults.find(
          (r) => r.subjectId === args.subjectId && r.sectionId === args.sectionId,
        );

        if (existing) {
          if (existing.isLocked) continue; // Skip locked results
          await ctx.db.patch(existing._id, {
            marksObtained: result.marksObtained,
            maxMarks: result.maxMarks,
            grade,
            enteredBy: userId,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert('examResults', {
            schoolId: scopedSchoolId,
            examSessionId: args.examSessionId,
            studentId: result.studentId,
            subjectId: args.subjectId,
            sectionId: args.sectionId,
            marksObtained: result.marksObtained,
            maxMarks: result.maxMarks,
            grade,
            enteredBy: userId,
            isLocked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
        savedCount++;
      }

      return { savedCount };
    });
  },
});
