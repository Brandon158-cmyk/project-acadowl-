import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

export const getDailyCashbookReport = query({
  args: {
    date: v.string(), // ISO date string e.g. "2025-03-22"
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return { date: args.date, totalZMW: 0, entries: [], byMethod: {} };
      }

      // Parse date range
      const dayStart = new Date(args.date).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      // Get all confirmed payments for this date
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_school_date', (q) => q.eq('schoolId', schoolId))
        .filter((q) =>
          q.and(
            q.gte(q.field('createdAt'), dayStart),
            q.lt(q.field('createdAt'), dayEnd),
            q.eq(q.field('status'), 'confirmed'),
          ),
        )
        .collect();

      let totalCents = 0;
      const byMethod: Record<string, number> = {};

      const entries = await Promise.all(
        payments.map(async (p) => {
          const student = await ctx.db.get(p.studentId);
          const invoice = await ctx.db.get(p.invoiceId);
          const cents = Math.round(p.amountZMW * 100);
          totalCents += cents;

          const method = p.method;
          byMethod[method] = (byMethod[method] ?? 0) + cents / 100;

          return {
            paymentId: p._id,
            receiptNumber: p.receiptNumber,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
            invoiceNumber: invoice?.invoiceNumber ?? 'N/A',
            amountZMW: p.amountZMW,
            method: p.method,
            reference: p.reference ?? p.mobileMoneyReference,
            time: new Date(p.createdAt).toISOString(),
          };
        }),
      );

      // Sort by time
      entries.sort((a, b) => a.time.localeCompare(b.time));

      return {
        date: args.date,
        totalZMW: totalCents / 100,
        entries,
        byMethod,
      };
    });
  },
});
