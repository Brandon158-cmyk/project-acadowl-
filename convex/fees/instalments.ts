import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

export const getInstalmentStatus = query({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) return null;

      // Get the fee structures for this invoice's term to find instalment schedules
      const lineItems = invoice.lineItems;
      if (!lineItems || lineItems.length === 0) return null;

      // Get all fee structures for this term
      const feeStructures = await ctx.db
        .query('feeStructures')
        .withIndex('by_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', invoice.termId),
        )
        .collect();

      // Find structures with instalment schedules
      const structuresWithInstalments = feeStructures.filter(
        (fs) => fs.instalmentSchedule && fs.instalmentSchedule.length > 0,
      );

      if (structuresWithInstalments.length === 0) return null;

      // Get all payments for this invoice
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_invoice', (q) => q.eq('invoiceId', args.invoiceId))
        .collect();

      const confirmedPayments = payments.filter(
        (p) => p.status === 'confirmed',
      );
      const totalPaidCents = confirmedPayments.reduce(
        (sum, p) => sum + Math.round(p.amountZMW * 100),
        0,
      );

      // Build instalment status from the first structure with instalments
      // (typically the main tuition fee structure)
      const primarySchedule = structuresWithInstalments[0].instalmentSchedule!;
      let runningPaidCents = totalPaidCents;
      const now = Date.now();

      const instalments = primarySchedule.map((inst) => {
        const instAmountCents = Math.round(inst.amountZMW * 100);
        const dueDateMs = new Date(inst.dueDate).getTime();
        let status: 'paid' | 'partial' | 'upcoming' | 'overdue';
        let paidZMW = 0;

        if (runningPaidCents >= instAmountCents) {
          status = 'paid';
          paidZMW = inst.amountZMW;
          runningPaidCents -= instAmountCents;
        } else if (runningPaidCents > 0) {
          status = 'partial';
          paidZMW = runningPaidCents / 100;
          runningPaidCents = 0;
        } else if (dueDateMs < now) {
          status = 'overdue';
        } else {
          status = 'upcoming';
        }

        return {
          label: inst.label,
          dueDate: inst.dueDate,
          amountZMW: inst.amountZMW,
          paidZMW,
          balanceZMW: Math.round((inst.amountZMW - paidZMW) * 100) / 100,
          status,
        };
      });

      return {
        invoiceId: args.invoiceId,
        totalZMW: invoice.totalZMW,
        paidZMW: invoice.paidZMW,
        balanceZMW: invoice.balanceZMW,
        instalments,
      };
    });
  },
});
