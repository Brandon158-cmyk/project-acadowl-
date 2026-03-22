import { v } from 'convex/values';
import { query, internalMutation } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

export const logFeeAudit = internalMutation({
  args: {
    schoolId: v.id('schools'),
    action: v.union(
      v.literal('invoice_created'),
      v.literal('invoice_voided'),
      v.literal('payment_recorded'),
      v.literal('payment_reversed'),
      v.literal('credit_note_created'),
      v.literal('scholarship_applied'),
      v.literal('zra_submitted'),
      v.literal('zra_failed'),
      v.literal('fee_structure_changed'),
      v.literal('invoice_regenerated'),
    ),
    performedBy: v.id('users'),
    relatedInvoiceId: v.optional(v.id('invoices')),
    relatedPaymentId: v.optional(v.id('payments')),
    relatedStudentId: v.optional(v.id('students')),
    amountZMW: v.optional(v.number()),
    previousValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('feeAuditLog', {
      schoolId: args.schoolId,
      action: args.action,
      performedBy: args.performedBy,
      relatedInvoiceId: args.relatedInvoiceId,
      relatedPaymentId: args.relatedPaymentId,
      relatedStudentId: args.relatedStudentId,
      amountZMW: args.amountZMW,
      previousValue: args.previousValue,
      newValue: args.newValue,
      ipAddress: args.ipAddress,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const getAuditLog = query({
  args: {
    limit: v.optional(v.number()),
    invoiceId: v.optional(v.id('invoices')),
    studentId: v.optional(v.id('students')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      let entries;

      if (args.invoiceId) {
        entries = await ctx.db
          .query('feeAuditLog')
          .withIndex('by_invoice', (q) =>
            q.eq('relatedInvoiceId', args.invoiceId),
          )
          .filter((q) => q.eq(q.field('schoolId'), schoolId))
          .collect();
      } else if (args.studentId) {
        entries = await ctx.db
          .query('feeAuditLog')
          .withIndex('by_student', (q) =>
            q.eq('relatedStudentId', args.studentId),
          )
          .filter((q) => q.eq(q.field('schoolId'), schoolId))
          .collect();
      } else {
        entries = await ctx.db
          .query('feeAuditLog')
          .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
          .order('desc')
          .take(args.limit ?? 100);
      }

      // Enrich with performer names
      return Promise.all(
        entries.map(async (entry) => {
          const performer = await ctx.db.get(entry.performedBy);
          const student = entry.relatedStudentId
            ? await ctx.db.get(entry.relatedStudentId)
            : null;
          const invoice = entry.relatedInvoiceId
            ? await ctx.db.get(entry.relatedInvoiceId)
            : null;

          return {
            ...entry,
            performerName: performer
              ? `${(performer as any).firstName ?? ''} ${(performer as any).lastName ?? ''}`.trim()
              : 'System',
            studentName: student
              ? `${(student as any).firstName} ${(student as any).lastName}`
              : null,
            invoiceNumber: invoice?.invoiceNumber ?? null,
          };
        }),
      );
    });
  },
});
