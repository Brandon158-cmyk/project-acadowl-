import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

export const getCollectionAnalytics = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return { byGrade: [], dailyCollections: [] };
      }

      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');

      // Collection rate by grade
      const gradeMap = new Map<
        string,
        { invoicedCents: number; collectedCents: number; count: number }
      >();

      for (const inv of activeInvoices) {
        const student = await ctx.db.get(inv.studentId);
        const gradeId = student?.currentGradeId;
        if (!gradeId) continue;

        const key = gradeId as string;
        if (!gradeMap.has(key)) {
          gradeMap.set(key, { invoicedCents: 0, collectedCents: 0, count: 0 });
        }
        const entry = gradeMap.get(key)!;
        entry.invoicedCents += Math.round(inv.totalZMW * 100);
        entry.collectedCents += Math.round(inv.paidZMW * 100);
        entry.count++;
      }

      const byGrade = await Promise.all(
        Array.from(gradeMap.entries()).map(async ([gradeId, data]) => {
          const grade = await ctx.db.get(gradeId as any);
          return {
            gradeId,
            gradeName: grade ? (grade as any).name : 'Unknown',
            invoicedZMW: data.invoicedCents / 100,
            collectedZMW: data.collectedCents / 100,
            outstandingZMW: (data.invoicedCents - data.collectedCents) / 100,
            collectionRate:
              data.invoicedCents > 0
                ? Math.round((data.collectedCents / data.invoicedCents) * 10000) / 100
                : 0,
            studentCount: data.count,
          };
        }),
      );

      // Daily collection trend (last 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_school_date', (q) => q.eq('schoolId', schoolId))
        .filter((q) =>
          q.and(
            q.gte(q.field('createdAt'), thirtyDaysAgo),
            q.eq(q.field('status'), 'confirmed'),
          ),
        )
        .collect();

      // Group payments by date
      const dailyMap = new Map<string, number>();
      for (const p of payments) {
        const inv = await ctx.db.get(p.invoiceId);
        if (!inv || inv.termId !== args.termId) continue;

        const date = new Date(p.createdAt).toISOString().split('T')[0];
        const cents = Math.round(p.amountZMW * 100);
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + cents);
      }

      const dailyCollections = Array.from(dailyMap.entries())
        .map(([date, cents]) => ({
          date,
          amountZMW: cents / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { byGrade, dailyCollections };
    });
  },
});

export const getPaymentMethodTrends = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return { methods: [] };

      const payments = await ctx.db
        .query('payments')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('status'), 'confirmed'))
        .collect();

      const methodMap = new Map<string, { count: number; totalCents: number }>();

      for (const p of payments) {
        const inv = await ctx.db.get(p.invoiceId);
        if (!inv || inv.termId !== args.termId) continue;

        if (!methodMap.has(p.method)) {
          methodMap.set(p.method, { count: 0, totalCents: 0 });
        }
        const entry = methodMap.get(p.method)!;
        entry.count++;
        entry.totalCents += Math.round(p.amountZMW * 100);
      }

      const methods = Array.from(methodMap.entries()).map(
        ([method, data]) => ({
          method,
          count: data.count,
          totalZMW: data.totalCents / 100,
        }),
      );

      return { methods };
    });
  },
});
