import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { getPrimaryGuardianId } from './_helpers';

export const getTermFinancialSummaryReport = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return {
          term: null,
          invoiceSummary: { total: 0, invoicedZMW: 0, collectedZMW: 0, outstandingZMW: 0 },
          byFeeType: [],
          byGrade: [],
          paymentMethods: [],
          creditNotes: { count: 0, totalZMW: 0 },
          arrears: { count: 0, totalZMW: 0 },
        };
      }

      const term = await ctx.db.get(args.termId);

      // Invoices
      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');
      const now = Date.now();

      let invoicedCents = 0;
      let collectedCents = 0;
      let outstandingCents = 0;
      let arrearsCount = 0;
      let arrearsCents = 0;

      const feeTypeMap = new Map<string, { invoicedCents: number; collectedCents: number }>();
      const gradeMap = new Map<string, { invoicedCents: number; collectedCents: number; count: number }>();

      for (const inv of activeInvoices) {
        const invCents = Math.round(inv.totalZMW * 100);
        const paidCents = Math.round(inv.paidZMW * 100);
        const balCents = Math.round(inv.balanceZMW * 100);

        invoicedCents += invCents;
        collectedCents += paidCents;
        outstandingCents += balCents;

        if (inv.dueDate < now && balCents > 0) {
          arrearsCount++;
          arrearsCents += balCents;
        }

        // By fee type
        for (const item of inv.lineItems) {
          const key = item.feeTypeId;
          if (!feeTypeMap.has(key)) {
            feeTypeMap.set(key, { invoicedCents: 0, collectedCents: 0 });
          }
          const entry = feeTypeMap.get(key)!;
          entry.invoicedCents += Math.round(item.totalZMW * 100);
        }

        // By grade
        const student = await ctx.db.get(inv.studentId);
        if (student?.currentGradeId) {
          const gKey = student.currentGradeId as string;
          if (!gradeMap.has(gKey)) {
            gradeMap.set(gKey, { invoicedCents: 0, collectedCents: 0, count: 0 });
          }
          const gEntry = gradeMap.get(gKey)!;
          gEntry.invoicedCents += invCents;
          gEntry.collectedCents += paidCents;
          gEntry.count++;
        }
      }

      // Get school fee types for labels
      const school = await ctx.db.get(schoolId);
      const feeTypes = school?.feeTypes ?? [];

      const byFeeType = Array.from(feeTypeMap.entries()).map(([feeTypeId, data]) => {
        const ft = feeTypes.find((f) => f.id === feeTypeId);
        return {
          feeTypeId,
          feeTypeName: ft?.name ?? feeTypeId,
          invoicedZMW: data.invoicedCents / 100,
          collectedZMW: data.collectedCents / 100,
          outstandingZMW: (data.invoicedCents - data.collectedCents) / 100,
        };
      });

      const byGrade = await Promise.all(
        Array.from(gradeMap.entries()).map(async ([gradeId, data]) => {
          const grade = await ctx.db.get(gradeId as any);
          return {
            gradeId,
            gradeName: grade ? (grade as any).name : 'Unknown',
            studentCount: data.count,
            invoicedZMW: data.invoicedCents / 100,
            collectedZMW: data.collectedCents / 100,
            outstandingZMW: (data.invoicedCents - data.collectedCents) / 100,
            collectionRate:
              data.invoicedCents > 0
                ? Math.round((data.collectedCents / data.invoicedCents) * 10000) / 100
                : 0,
          };
        }),
      );

      // Payment methods
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
        const m = methodMap.get(p.method)!;
        m.count++;
        m.totalCents += Math.round(p.amountZMW * 100);
      }

      const paymentMethods = Array.from(methodMap.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        totalZMW: data.totalCents / 100,
      }));

      // Credit notes
      const creditNotes = await ctx.db
        .query('creditNotes')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      const termCreditNotes = [];
      for (const cn of creditNotes) {
        const inv = await ctx.db.get(cn.invoiceId);
        if (inv && inv.termId === args.termId) {
          termCreditNotes.push(cn);
        }
      }

      const cnTotalCents = termCreditNotes.reduce(
        (sum, cn) => sum + Math.round(cn.amountZMW * 100),
        0,
      );

      return {
        term: term ? { name: term.name, startDate: term.startDate, endDate: term.endDate } : null,
        invoiceSummary: {
          total: activeInvoices.length,
          invoicedZMW: invoicedCents / 100,
          collectedZMW: collectedCents / 100,
          outstandingZMW: outstandingCents / 100,
        },
        byFeeType,
        byGrade,
        paymentMethods,
        creditNotes: { count: termCreditNotes.length, totalZMW: cnTotalCents / 100 },
        arrears: { count: arrearsCount, totalZMW: arrearsCents / 100 },
      };
    });
  },
});

export const generateStudentFeesStatement = query({
  args: {
    studentId: v.id('students'),
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== schoolId) return null;

      const school = await ctx.db.get(schoolId);
      if (!school) return null;

      const primaryGuardianId = getPrimaryGuardianId(student);
      const guardian = primaryGuardianId
        ? await ctx.db.get(primaryGuardianId)
        : null;

      // Get invoices
      let invoicesQuery = ctx.db
        .query('invoices')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) => q.eq(q.field('schoolId'), schoolId));

      const allInvoices = await invoicesQuery.collect();
      const invoices = args.termId
        ? allInvoices.filter((inv) => inv.termId === args.termId)
        : allInvoices;

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');

      // Get all payments
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) =>
          q.and(
            q.eq(q.field('schoolId'), schoolId),
            q.eq(q.field('status'), 'confirmed'),
          ),
        )
        .collect();

      const termPayments = args.termId
        ? payments.filter((p) => {
            const inv = allInvoices.find((i) => i._id === p.invoiceId);
            return inv && inv.termId === args.termId;
          })
        : payments;

      let totalInvoicedCents = 0;
      let totalPaidCents = 0;

      for (const inv of activeInvoices) {
        totalInvoicedCents += Math.round(inv.totalZMW * 100);
        totalPaidCents += Math.round(inv.paidZMW * 100);
      }

      // Get ledger entries
      const ledgerEntries = primaryGuardianId
        ? await ctx.db
            .query('guardianLedger')
            .withIndex('by_guardian_student', (q) =>
              q
                .eq('guardianId', primaryGuardianId)
                .eq('studentId', args.studentId),
            )
            .collect()
        : [];

      const termLedger = args.termId
        ? ledgerEntries.filter((e) => e.termId === args.termId)
        : ledgerEntries;

      return {
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentNumber: student.studentNumber,
        },
        guardian: guardian
          ? { firstName: (guardian as any).firstName, lastName: (guardian as any).lastName, phone: (guardian as any).phone }
          : null,
        school: { name: school.name, logoUrl: school.branding?.logoUrl },
        summary: {
          totalInvoicedZMW: totalInvoicedCents / 100,
          totalPaidZMW: totalPaidCents / 100,
          outstandingZMW: (totalInvoicedCents - totalPaidCents) / 100,
        },
        invoices: activeInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          totalZMW: inv.totalZMW,
          paidZMW: inv.paidZMW,
          balanceZMW: inv.balanceZMW,
          status: inv.status,
          dueDate: inv.dueDate,
        })),
        payments: termPayments.map((p) => ({
          receiptNumber: p.receiptNumber,
          amountZMW: p.amountZMW,
          method: p.method,
          createdAt: p.createdAt,
        })),
        ledger: termLedger.map((e) => ({
          date: e.transactionDate,
          description: e.description,
          debitZMW: e.debitZMW,
          creditZMW: e.creditZMW,
          balanceAfterZMW: e.balanceAfterZMW,
        })),
        generatedAt: Date.now(),
      };
    });
  },
});
