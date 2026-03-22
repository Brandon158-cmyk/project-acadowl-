import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getInvoiceById = query({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;
      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) return null;

      // Enrich with student and guardian names
      const student = await ctx.db.get(invoice.studentId);
      const guardian = invoice.guardianId
        ? await ctx.db.get(invoice.guardianId)
        : null;

      return {
        ...invoice,
        studentName: student
          ? `${student.firstName} ${student.lastName}`
          : 'Unknown',
        guardianName: guardian
          ? `${guardian.firstName} ${guardian.lastName}`
          : null,
      };
    });
  },
});

export const getInvoicesForStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('invoices')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) => q.eq(q.field('schoolId'), schoolId))
        .collect();
    });
  },
});

export const getInvoicesByTerm = query({
  args: {
    termId: v.id('terms'),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('sent'),
        v.literal('partial'),
        v.literal('paid'),
        v.literal('overdue'),
        v.literal('void'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      let invoicesQuery;
      if (args.status) {
        invoicesQuery = ctx.db
          .query('invoices')
          .withIndex('by_school_term', (q) =>
            q.eq('schoolId', schoolId).eq('termId', args.termId),
          )
          .filter((q) => q.eq(q.field('status'), args.status!));
      } else {
        invoicesQuery = ctx.db
          .query('invoices')
          .withIndex('by_school_term', (q) =>
            q.eq('schoolId', schoolId).eq('termId', args.termId),
          );
      }

      const invoices = await invoicesQuery.collect();

      // Enrich with student names
      const enriched = await Promise.all(
        invoices.map(async (invoice) => {
          const student = await ctx.db.get(invoice.studentId);
          return {
            ...invoice,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
          };
        }),
      );

      return enriched;
    });
  },
});

export const getInvoicesByGuardian = query({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('invoices')
        .withIndex('by_guardian', (q) => q.eq('guardianId', args.guardianId))
        .filter((q) => q.eq(q.field('schoolId'), schoolId))
        .collect();
    });
  },
});

export const voidInvoice = mutation({
  args: {
    invoiceId: v.id('invoices'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.VOID_INVOICE);
      if (!schoolId) throw new Error('School context required');

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'void') {
        throw new Error('Invoice is already voided');
      }

      if (invoice.paidZMW > 0) {
        throw new Error(
          'Cannot void an invoice with payments. Create a credit note instead.',
        );
      }

      const now = Date.now();
      await ctx.db.patch(args.invoiceId, {
        status: 'void',
        updatedAt: now,
      });

      // Reverse the ledger entry
      if (invoice.guardianId) {
        const prevEntries = await ctx.db
          .query('guardianLedger')
          .withIndex('by_guardian_student', (q) =>
            q
              .eq('guardianId', invoice.guardianId!)
              .eq('studentId', invoice.studentId),
          )
          .collect();

        const lastBalance =
          prevEntries.length > 0
            ? prevEntries[prevEntries.length - 1].balanceAfterZMW
            : 0;

        await ctx.db.insert('guardianLedger', {
          schoolId,
          guardianId: invoice.guardianId,
          studentId: invoice.studentId,
          termId: invoice.termId,
          entryType: 'credit_note',
          description: `Void: Invoice ${invoice.invoiceNumber} — ${args.reason}`,
          debitZMW: 0,
          creditZMW: invoice.totalZMW,
          balanceAfterZMW: lastBalance - invoice.totalZMW,
          referenceId: args.invoiceId,
          transactionDate: new Date(now).toISOString().split('T')[0],
          createdAt: now,
        });
      }

      // Log audit
      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'invoice_voided',
        performedBy: userId,
        relatedInvoiceId: args.invoiceId,
        relatedStudentId: invoice.studentId,
        amountZMW: invoice.totalZMW,
        notes: args.reason,
        createdAt: now,
      });
    });
  },
});

export const sendInvoice = mutation({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.CREATE_INVOICE);
      if (!schoolId) throw new Error('School context required');

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be sent');
      }

      await ctx.db.patch(args.invoiceId, {
        status: 'sent',
        updatedAt: Date.now(),
      });
    });
  },
});

export const getInvoiceSummaryForTerm = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return {
          totalInvoices: 0,
          totalAmountZMW: 0,
          totalPaidZMW: 0,
          totalBalanceZMW: 0,
          byStatus: {} as Record<string, number>,
        };
      }

      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();

      const activeInvoices = invoices.filter((inv) => inv.status !== 'void');

      const byStatus: Record<string, number> = {};
      let totalAmountCents = 0;
      let totalPaidCents = 0;
      let totalBalanceCents = 0;

      for (const inv of activeInvoices) {
        byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
        totalAmountCents += Math.round(inv.totalZMW * 100);
        totalPaidCents += Math.round(inv.paidZMW * 100);
        totalBalanceCents += Math.round(inv.balanceZMW * 100);
      }

      return {
        totalInvoices: activeInvoices.length,
        totalAmountZMW: totalAmountCents / 100,
        totalPaidZMW: totalPaidCents / 100,
        totalBalanceZMW: totalBalanceCents / 100,
        byStatus,
      };
    });
  },
});
