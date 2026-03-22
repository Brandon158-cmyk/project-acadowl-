import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const generateConsolidatedInvoice = mutation({
  args: {
    guardianId: v.id('guardians'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.CREATE_INVOICE);
      if (!schoolId) throw new Error('School context required');

      // Get all invoices for this guardian's children in the term
      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_guardian', (q) => q.eq('guardianId', args.guardianId))
        .filter((q) =>
          q.and(
            q.eq(q.field('termId'), args.termId),
            q.eq(q.field('schoolId'), schoolId),
            q.neq(q.field('status'), 'void'),
          ),
        )
        .collect();

      if (invoices.length < 2) {
        throw new Error(
          'At least 2 child invoices are required to create a consolidated invoice',
        );
      }

      // Check if a consolidated invoice already exists
      const existing = await ctx.db
        .query('consolidatedInvoices')
        .withIndex('by_guardian_term', (q) =>
          q.eq('guardianId', args.guardianId).eq('termId', args.termId),
        )
        .first();

      if (existing && existing.status !== 'void') {
        throw new Error('A consolidated invoice already exists for this guardian and term');
      }

      // Calculate totals using integer-cent arithmetic
      let totalCents = 0;
      let paidCents = 0;
      const childInvoiceIds = [];

      for (const inv of invoices) {
        totalCents += Math.round(inv.totalZMW * 100);
        paidCents += Math.round(inv.paidZMW * 100);
        childInvoiceIds.push(inv._id);
      }

      const balanceCents = totalCents - paidCents;

      // Generate consolidated invoice number
      const counter = await ctx.db
        .query('counters')
        .withIndex('by_school_key', (q) =>
          q.eq('schoolId', schoolId).eq('key', 'consolidated_invoice_number'),
        )
        .unique();

      let nextNumber = 1;
      if (counter) {
        nextNumber = counter.value + 1;
        await ctx.db.patch(counter._id, { value: nextNumber });
      } else {
        await ctx.db.insert('counters', {
          schoolId,
          key: 'consolidated_invoice_number',
          value: nextNumber,
        });
      }

      const invoiceNumber = `CINV-${String(nextNumber).padStart(6, '0')}`;

      const status =
        balanceCents === 0
          ? ('paid' as const)
          : paidCents > 0
            ? ('partial' as const)
            : ('open' as const);

      const consolidatedId = await ctx.db.insert('consolidatedInvoices', {
        schoolId,
        guardianId: args.guardianId,
        termId: args.termId,
        childInvoiceIds,
        invoiceNumber,
        totalZMW: totalCents / 100,
        paidZMW: paidCents / 100,
        balanceZMW: balanceCents / 100,
        status,
        createdAt: Date.now(),
      });

      // Link child invoices to consolidated invoice
      for (const inv of invoices) {
        await ctx.db.patch(inv._id, {
          consolidatedInvoiceId: consolidatedId,
          updatedAt: Date.now(),
        });
      }

      return consolidatedId;
    });
  },
});

export const getConsolidatedInvoice = query({
  args: {
    consolidatedInvoiceId: v.id('consolidatedInvoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;

      const consolidated = await ctx.db.get(args.consolidatedInvoiceId);
      if (!consolidated || consolidated.schoolId !== schoolId) return null;

      // Enrich with child invoice details
      const childInvoices = await Promise.all(
        consolidated.childInvoiceIds.map(async (id) => {
          const inv = await ctx.db.get(id);
          if (!inv) return null;
          const student = await ctx.db.get(inv.studentId);
          return {
            ...inv,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
          };
        }),
      );

      const guardian = await ctx.db.get(consolidated.guardianId);

      return {
        ...consolidated,
        guardianName: guardian
          ? `${guardian.firstName} ${guardian.lastName}`
          : 'Unknown',
        childInvoices: childInvoices.filter(Boolean),
      };
    });
  },
});

export const getConsolidatedInvoicesForGuardian = query({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      return ctx.db
        .query('consolidatedInvoices')
        .withIndex('by_guardian_term', (q) =>
          q.eq('guardianId', args.guardianId),
        )
        .filter((q) => q.eq(q.field('schoolId'), schoolId))
        .collect();
    });
  },
});
