import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getBankStatementImports = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('bankStatementImports')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();
    });
  },
});

export const importBankStatement = mutation({
  args: {
    bankName: v.string(),
    accountNumber: v.string(),
    statementPeriodFrom: v.string(),
    statementPeriodTo: v.string(),
    fileUrl: v.string(),
    transactions: v.array(
      v.object({
        date: v.string(),
        description: v.string(),
        amountZMW: v.number(),
        reference: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.PROCESS_PAYMENTS);
      if (!schoolId) throw new Error('School context required');

      let matchedCount = 0;
      let unmatchedCount = 0;

      for (const txn of args.transactions) {
        // Try to auto-match by reference to invoice number
        let matched = false;
        if (txn.reference) {
          const invoice = await ctx.db
            .query('invoices')
            .withIndex('by_invoice_number', (q) =>
              q.eq('schoolId', schoolId).eq('invoiceNumber', txn.reference!),
            )
            .first();

          if (
            invoice &&
            invoice.status !== 'void' &&
            invoice.status !== 'paid'
          ) {
            matched = true;
            matchedCount++;

            // Record payment
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
            const amountCents = Math.round(txn.amountZMW * 100);
            const balanceCents = Math.round(invoice.balanceZMW * 100);
            const appliedCents = Math.min(amountCents, balanceCents);

            await ctx.db.insert('payments', {
              schoolId,
              invoiceId: invoice._id,
              studentId: invoice.studentId,
              amountZMW: appliedCents / 100,
              method: 'bank_transfer',
              reference: txn.reference,
              receiptNumber,
              status: 'confirmed',
              recordedBy: userId,
              receivedAt: new Date(txn.date).getTime(),
              confirmedAt: now,
              createdAt: now,
              updatedAt: now,
            });

            // Update invoice
            const newPaidCents =
              Math.round(invoice.paidZMW * 100) + appliedCents;
            const newBalanceCents =
              Math.round(invoice.totalZMW * 100) - newPaidCents;
            const newStatus =
              newBalanceCents <= 0
                ? ('paid' as const)
                : ('partial' as const);

            await ctx.db.patch(invoice._id, {
              paidZMW: newPaidCents / 100,
              balanceZMW: Math.max(0, newBalanceCents / 100),
              status: newStatus,
              updatedAt: now,
            });
          }
        }

        if (!matched) {
          unmatchedCount++;
        }
      }

      const importId = await ctx.db.insert('bankStatementImports', {
        schoolId,
        bankName: args.bankName,
        accountNumber: args.accountNumber,
        statementPeriodFrom: args.statementPeriodFrom,
        statementPeriodTo: args.statementPeriodTo,
        totalTransactions: args.transactions.length,
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
        uploadedBy: userId,
        uploadedAt: Date.now(),
        fileUrl: args.fileUrl,
        status: unmatchedCount > 0 ? 'pending_review' : 'reconciled',
      });

      return {
        importId,
        totalTransactions: args.transactions.length,
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
      };
    });
  },
});
