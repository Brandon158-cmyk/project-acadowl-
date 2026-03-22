import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

export const getFinanceDashboardStats = query({
  args: {
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return {
          totalInvoicedZMW: 0,
          totalCollectedZMW: 0,
          totalOutstandingZMW: 0,
          collectionRate: 0,
          invoiceCount: 0,
          paidCount: 0,
          partialCount: 0,
          overdueCount: 0,
          recentPayments: [],
          paymentMethodBreakdown: {},
        };
      }

      // If no termId provided, use the school's current term
      let termId = args.termId;
      if (!termId) {
        const school = await ctx.db.get(schoolId);
        termId = school?.currentTermId ?? undefined;
        if (!termId) {
          return {
            totalInvoicedZMW: 0,
            totalCollectedZMW: 0,
            totalOutstandingZMW: 0,
            collectionRate: 0,
            invoiceCount: 0,
            paidCount: 0,
            partialCount: 0,
            overdueCount: 0,
            recentPayments: [],
            paymentMethodBreakdown: {},
          };
        }
      }

      const now = Date.now();

      // Get all invoices for term
      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', termId!),
        )
        .collect();

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');

      let totalInvoicedCents = 0;
      let totalCollectedCents = 0;
      let totalOutstandingCents = 0;
      let paidCount = 0;
      let partialCount = 0;
      let overdueCount = 0;

      for (const inv of activeInvoices) {
        totalInvoicedCents += Math.round(inv.totalZMW * 100);
        totalCollectedCents += Math.round(inv.paidZMW * 100);
        totalOutstandingCents += Math.round(inv.balanceZMW * 100);

        if (inv.status === 'paid') paidCount++;
        else if (inv.status === 'partial') partialCount++;
        else if (inv.status === 'overdue' || (inv.dueDate < now && inv.balanceZMW > 0)) {
          overdueCount++;
        }
      }

      const collectionRate =
        totalInvoicedCents > 0
          ? Math.round((totalCollectedCents / totalInvoicedCents) * 10000) / 100
          : 0;

      // Get recent payments (last 10)
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_school_date', (q) => q.eq('schoolId', schoolId))
        .order('desc')
        .take(10);

      const recentPayments = await Promise.all(
        payments.map(async (p) => {
          const student = await ctx.db.get(p.studentId);
          return {
            id: p._id,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
            amountZMW: p.amountZMW,
            method: p.method,
            receiptNumber: p.receiptNumber,
            createdAt: p.createdAt,
          };
        }),
      );

      // Payment method breakdown
      const allPayments = await ctx.db
        .query('payments')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('status'), 'confirmed'))
        .collect();

      // Filter to current term payments by checking their linked invoice
      const paymentMethodBreakdown: Record<string, number> = {};
      for (const p of allPayments) {
        const inv = await ctx.db.get(p.invoiceId);
        if (!inv || inv.termId !== termId) continue;

        const method = p.method;
        const cents = Math.round(p.amountZMW * 100);
        paymentMethodBreakdown[method] =
          (paymentMethodBreakdown[method] ?? 0) + cents / 100;
      }

      return {
        totalInvoicedZMW: totalInvoicedCents / 100,
        totalCollectedZMW: totalCollectedCents / 100,
        totalOutstandingZMW: totalOutstandingCents / 100,
        collectionRate,
        invoiceCount: activeInvoices.length,
        paidCount,
        partialCount,
        overdueCount,
        recentPayments,
        paymentMethodBreakdown,
      };
    });
  },
});
