import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { getPrimaryGuardianId } from './_helpers';

export const getStudentLedger = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== schoolId) return [];
      const primaryGuardianId = getPrimaryGuardianId(student);
      if (!primaryGuardianId) return [];

      return ctx.db
        .query('guardianLedger')
        .withIndex('by_guardian_student', (q) =>
          q
            .eq('guardianId', primaryGuardianId)
            .eq('studentId', args.studentId),
        )
        .collect();
    });
  },
});

export const getGuardianLedger = query({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const entries = await ctx.db
        .query('guardianLedger')
        .withIndex('by_guardian_student', (q) =>
          q.eq('guardianId', args.guardianId),
        )
        .collect();

      // Filter by school and enrich with student names
      const schoolEntries = entries.filter((e) => e.schoolId === schoolId);

      return Promise.all(
        schoolEntries.map(async (entry) => {
          const student = await ctx.db.get(entry.studentId);
          return {
            ...entry,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
          };
        }),
      );
    });
  },
});

export const getGuardianBalance = query({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return { totalDebitZMW: 0, totalCreditZMW: 0, balanceZMW: 0 };

      const entries = await ctx.db
        .query('guardianLedger')
        .withIndex('by_guardian_student', (q) =>
          q.eq('guardianId', args.guardianId),
        )
        .collect();

      const schoolEntries = entries.filter((e) => e.schoolId === schoolId);

      let totalDebitCents = 0;
      let totalCreditCents = 0;

      for (const entry of schoolEntries) {
        totalDebitCents += Math.round(entry.debitZMW * 100);
        totalCreditCents += Math.round(entry.creditZMW * 100);
      }

      return {
        totalDebitZMW: totalDebitCents / 100,
        totalCreditZMW: totalCreditCents / 100,
        balanceZMW: (totalDebitCents - totalCreditCents) / 100,
      };
    });
  },
});

export const getLedgerForTerm = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      return ctx.db
        .query('guardianLedger')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();
    });
  },
});
