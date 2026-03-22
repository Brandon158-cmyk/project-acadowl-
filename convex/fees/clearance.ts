import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { getPrimaryGuardianId } from './_helpers';

// Generate a fees clearance certificate data object
// The actual PDF generation will be handled in the frontend or a separate action
export const generateFeesClearanceData = query({
  args: {
    studentId: v.id('students'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== schoolId) return null;

      const school = await ctx.db.get(schoolId);
      if (!school) return null;

      const term = await ctx.db.get(args.termId);
      if (!term) return null;

      // Get all invoices for this student and term
      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_student_term', (q) =>
          q.eq('studentId', args.studentId).eq('termId', args.termId),
        )
        .collect();

      const activeInvoices = invoices.filter(
        (inv) => inv.schoolId === schoolId && inv.status !== 'void',
      );

      let totalInvoicedCents = 0;
      let totalPaidCents = 0;

      for (const inv of activeInvoices) {
        totalInvoicedCents += Math.round(inv.totalZMW * 100);
        totalPaidCents += Math.round(inv.paidZMW * 100);
      }

      const outstandingCents = totalInvoicedCents - totalPaidCents;
      const isCleared = outstandingCents <= 0;

      // Get guardian info
      const primaryGuardianId = getPrimaryGuardianId(student);
      const guardian = primaryGuardianId
        ? await ctx.db.get(primaryGuardianId)
        : null;

      return {
        isCleared,
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentNumber: student.studentNumber,
          gradeName: student.currentGradeId
            ? (await ctx.db.get(student.currentGradeId))?.name ?? ''
            : '',
        },
        guardian: guardian
          ? {
              firstName: (guardian as any).firstName,
              lastName: (guardian as any).lastName,
              phone: (guardian as any).phone,
            }
          : null,
        school: {
          name: school.name,
          logoUrl: school.branding?.logoUrl,
        },
        term: {
          name: term.name,
          startDate: term.startDate,
          endDate: term.endDate,
        },
        summary: {
          totalInvoicedZMW: totalInvoicedCents / 100,
          totalPaidZMW: totalPaidCents / 100,
          outstandingZMW: outstandingCents / 100,
        },
        invoices: activeInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          totalZMW: inv.totalZMW,
          paidZMW: inv.paidZMW,
          balanceZMW: inv.balanceZMW,
          status: inv.status,
        })),
        generatedAt: Date.now(),
      };
    });
  },
});
