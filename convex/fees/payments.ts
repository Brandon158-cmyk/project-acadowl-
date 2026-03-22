import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const recordManualPayment = mutation({
  args: {
    invoiceId: v.id('invoices'),
    amountZMW: v.number(),
    method: v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('cheque'),
      v.literal('airtel_money'),
      v.literal('mtn_momo'),
    ),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.RECORD_PAYMENT);
      if (!schoolId) throw new Error('School context required');

      if (args.amountZMW <= 0) {
        throw new Error('Payment amount must be positive');
      }

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'void') {
        throw new Error('Cannot record payment against a voided invoice');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already fully paid');
      }

      const amountCents = Math.round(args.amountZMW * 100);
      const balanceCents = Math.round(invoice.balanceZMW * 100);

      // Check for overpayment
      const isOverpayment = amountCents > balanceCents;
      const appliedCents = isOverpayment ? balanceCents : amountCents;
      const overpaymentCents = isOverpayment ? amountCents - balanceCents : 0;

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
      const now = Date.now();

      // Create payment record
      const paymentId = await ctx.db.insert('payments', {
        schoolId,
        invoiceId: args.invoiceId,
        studentId: invoice.studentId,
        amountZMW: appliedCents / 100,
        method: args.method,
        reference: args.reference,
        receiptNumber,
        status: 'confirmed',
        recordedBy: userId,
        receivedBy: userId,
        receivedAt: args.receivedAt ?? now,
        confirmedAt: now,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });

      // Update invoice
      const newPaidCents = Math.round(invoice.paidZMW * 100) + appliedCents;
      const newBalanceCents = Math.round(invoice.totalZMW * 100) - newPaidCents;
      const newStatus =
        newBalanceCents <= 0
          ? ('paid' as const)
          : ('partial' as const);

      await ctx.db.patch(args.invoiceId, {
        paidZMW: newPaidCents / 100,
        balanceZMW: Math.max(0, newBalanceCents / 100),
        status: newStatus,
        updatedAt: now,
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
          description: `Payment ${receiptNumber} (${args.method})`,
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
        notes: `${args.method} payment: ${receiptNumber}`,
        createdAt: now,
      });

      // Handle overpayment — create credit note
      if (overpaymentCents > 0 && invoice.guardianId) {
        const creditCounter = await ctx.db
          .query('counters')
          .withIndex('by_school_key', (q) =>
            q.eq('schoolId', schoolId).eq('key', 'credit_note_number'),
          )
          .unique();

        let cnNumber = 1;
        if (creditCounter) {
          cnNumber = creditCounter.value + 1;
          await ctx.db.patch(creditCounter._id, { value: cnNumber });
        } else {
          await ctx.db.insert('counters', {
            schoolId,
            key: 'credit_note_number',
            value: cnNumber,
          });
        }

        await ctx.db.insert('creditNotes', {
          schoolId,
          invoiceId: args.invoiceId,
          studentId: invoice.studentId,
          guardianId: invoice.guardianId,
          creditNoteNumber: `CN-${String(cnNumber).padStart(6, '0')}`,
          amountZMW: overpaymentCents / 100,
          reason: 'Overpayment',
          type: 'overpayment_refund',
          authorisedBy: userId,
          status: 'issued',
          createdAt: now,
        });
      }

      return { paymentId, receiptNumber, overpaymentZMW: overpaymentCents / 100 };
    });
  },
});

export const getPaymentsForInvoice = query({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_invoice', (q) => q.eq('invoiceId', args.invoiceId))
        .collect();
      return payments.filter((p) => p.schoolId === schoolId);
    });
  },
});

export const getPaymentsForStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('payments')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) => q.eq(q.field('schoolId'), schoolId))
        .collect();
    });
  },
});

export const getRecentPayments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const payments = await ctx.db
        .query('payments')
        .withIndex('by_school_date', (q) => q.eq('schoolId', schoolId))
        .order('desc')
        .take(args.limit ?? 20);

      // Enrich with student names
      return Promise.all(
        payments.map(async (p) => {
          const student = await ctx.db.get(p.studentId);
          return {
            ...p,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
          };
        }),
      );
    });
  },
});

export const reversePayment = mutation({
  args: {
    paymentId: v.id('payments'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.PROCESS_PAYMENTS);
      if (!schoolId) throw new Error('School context required');

      const payment = await ctx.db.get(args.paymentId);
      if (!payment || payment.schoolId !== schoolId) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'reversed') {
        throw new Error('Payment is already reversed');
      }

      const now = Date.now();

      // Reverse the payment
      await ctx.db.patch(args.paymentId, {
        status: 'reversed',
        notes: `Reversed: ${args.reason}`,
        updatedAt: now,
      });

      // Update invoice balance
      const invoice = await ctx.db.get(payment.invoiceId);
      if (invoice) {
        const newPaidCents =
          Math.round(invoice.paidZMW * 100) - Math.round(payment.amountZMW * 100);
        const newBalanceCents =
          Math.round(invoice.totalZMW * 100) - Math.max(0, newPaidCents);

        const newStatus =
          newPaidCents <= 0
            ? ('sent' as const)
            : newBalanceCents <= 0
              ? ('paid' as const)
              : ('partial' as const);

        await ctx.db.patch(payment.invoiceId, {
          paidZMW: Math.max(0, newPaidCents / 100),
          balanceZMW: newBalanceCents / 100,
          status: newStatus,
          updatedAt: now,
        });
      }

      // Reverse ledger entry
      if (invoice?.guardianId) {
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
          description: `Payment reversed: ${payment.receiptNumber ?? args.paymentId} — ${args.reason}`,
          debitZMW: payment.amountZMW,
          creditZMW: 0,
          balanceAfterZMW: lastBalance + payment.amountZMW,
          referenceId: args.paymentId,
          transactionDate: new Date(now).toISOString().split('T')[0],
          createdAt: now,
        });
      }

      // Audit log
      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'payment_reversed',
        performedBy: userId,
        relatedInvoiceId: payment.invoiceId,
        relatedPaymentId: args.paymentId,
        relatedStudentId: payment.studentId,
        amountZMW: payment.amountZMW,
        notes: args.reason,
        createdAt: now,
      });
    });
  },
});
