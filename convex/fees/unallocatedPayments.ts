import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getUnallocatedPayments = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('unresolved'),
        v.literal('allocated'),
        v.literal('refunded'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      if (args.status) {
        return ctx.db
          .query('unallocatedPayments')
          .withIndex('by_status', (q) =>
            q.eq('schoolId', schoolId).eq('status', args.status!),
          )
          .collect();
      }

      return ctx.db
        .query('unallocatedPayments')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();
    });
  },
});

export const allocatePayment = mutation({
  args: {
    unallocatedPaymentId: v.id('unallocatedPayments'),
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.RECORD_PAYMENT);
      if (!schoolId) throw new Error('School context required');

      const unallocated = await ctx.db.get(args.unallocatedPaymentId);
      if (!unallocated || unallocated.schoolId !== schoolId) {
        throw new Error('Unallocated payment not found');
      }

      if (unallocated.status !== 'unresolved') {
        throw new Error('Payment has already been resolved');
      }

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'void' || invoice.status === 'paid') {
        throw new Error('Cannot allocate to a voided or fully paid invoice');
      }

      const amountCents = Math.round(unallocated.amountZMW * 100);
      const balanceCents = Math.round(invoice.balanceZMW * 100);
      const appliedCents = Math.min(amountCents, balanceCents);
      const now = Date.now();

      // Generate receipt number
      const counter = await ctx.db
        .query('counters')
        .withIndex('by_school_key', (q) =>
          q.eq('schoolId', schoolId).eq('key', 'receipt_number'),
        )
        .unique();

      let nextNumber = 1;
      if (counter) {
        nextNumber = counter.value + 1;
        await ctx.db.patch(counter._id, { value: nextNumber });
      } else {
        await ctx.db.insert('counters', {
          schoolId,
          key: 'receipt_number',
          value: nextNumber,
        });
      }

      const receiptNumber = `RCP-${String(nextNumber).padStart(6, '0')}`;

      // Create payment
      const paymentId = await ctx.db.insert('payments', {
        schoolId,
        invoiceId: args.invoiceId,
        studentId: invoice.studentId,
        amountZMW: appliedCents / 100,
        method: unallocated.source,
        mobileMoneyReference: unallocated.transactionId,
        payerPhone: unallocated.payerPhone,
        receiptNumber,
        status: 'confirmed',
        recordedBy: userId,
        receivedAt: unallocated.receivedAt,
        confirmedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      // Update invoice
      const newPaidCents = Math.round(invoice.paidZMW * 100) + appliedCents;
      const newBalanceCents = Math.round(invoice.totalZMW * 100) - newPaidCents;
      const newStatus =
        newBalanceCents <= 0 ? ('paid' as const) : ('partial' as const);

      await ctx.db.patch(args.invoiceId, {
        paidZMW: newPaidCents / 100,
        balanceZMW: Math.max(0, newBalanceCents / 100),
        status: newStatus,
        updatedAt: now,
      });

      // Mark unallocated as resolved
      await ctx.db.patch(args.unallocatedPaymentId, {
        status: 'allocated',
        allocatedToInvoiceId: args.invoiceId,
        resolvedBy: userId,
        resolvedAt: now,
      });

      // Create ledger entry
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
          entryType: 'payment',
          description: `Allocated mobile money payment ${receiptNumber}`,
          debitZMW: 0,
          creditZMW: appliedCents / 100,
          balanceAfterZMW: lastBalance - appliedCents / 100,
          referenceId: paymentId,
          transactionDate: new Date(now).toISOString().split('T')[0],
          createdAt: now,
        });
      }

      // Audit log
      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'payment_recorded',
        performedBy: userId,
        relatedInvoiceId: args.invoiceId,
        relatedPaymentId: paymentId,
        relatedStudentId: invoice.studentId,
        amountZMW: appliedCents / 100,
        notes: `Allocated from unresolved payment ${unallocated.transactionId}`,
        createdAt: now,
      });

      return { paymentId, receiptNumber };
    });
  },
});

export const markAsRefunded = mutation({
  args: {
    unallocatedPaymentId: v.id('unallocatedPayments'),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.PROCESS_PAYMENTS);
      if (!schoolId) throw new Error('School context required');

      const unallocated = await ctx.db.get(args.unallocatedPaymentId);
      if (!unallocated || unallocated.schoolId !== schoolId) {
        throw new Error('Unallocated payment not found');
      }

      if (unallocated.status !== 'unresolved') {
        throw new Error('Payment has already been resolved');
      }

      await ctx.db.patch(args.unallocatedPaymentId, {
        status: 'refunded',
        resolvedBy: userId,
        resolvedAt: Date.now(),
      });
    });
  },
});
