import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const createCreditNote = mutation({
  args: {
    invoiceId: v.id('invoices'),
    amountZMW: v.number(),
    reason: v.string(),
    type: v.union(
      v.literal('correction'),
      v.literal('refund'),
      v.literal('scholarship'),
      v.literal('boarding_adjustment'),
      v.literal('transport_adjustment'),
      v.literal('overpayment_refund'),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.MANAGE_CREDIT_NOTES);
      if (!schoolId) throw new Error('School context required');

      if (args.amountZMW <= 0) {
        throw new Error('Credit note amount must be positive');
      }

      const invoice = await ctx.db.get(args.invoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'void') {
        throw new Error('Cannot create credit note for a voided invoice');
      }

      if (!invoice.guardianId) {
        throw new Error('Invoice has no guardian — credit note requires a guardian');
      }

      // Generate credit note number
      const counter = await ctx.db
        .query('counters')
        .withIndex('by_school_key', (q) =>
          q.eq('schoolId', schoolId).eq('key', 'credit_note_number'),
        )
        .unique();

      let nextNumber = 1;
      if (counter) {
        nextNumber = counter.value + 1;
        await ctx.db.patch(counter._id, { value: nextNumber });
      } else {
        await ctx.db.insert('counters', {
          schoolId,
          key: 'credit_note_number',
          value: nextNumber,
        });
      }

      const creditNoteNumber = `CN-${String(nextNumber).padStart(6, '0')}`;
      const now = Date.now();

      const creditNoteId = await ctx.db.insert('creditNotes', {
        schoolId,
        invoiceId: args.invoiceId,
        studentId: invoice.studentId,
        guardianId: invoice.guardianId,
        creditNoteNumber,
        amountZMW: args.amountZMW,
        reason: args.reason,
        type: args.type,
        authorisedBy: userId,
        status: 'issued',
        createdAt: now,
      });

      // Create ledger entry
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
        description: `Credit Note ${creditNoteNumber}: ${args.reason}`,
        debitZMW: 0,
        creditZMW: args.amountZMW,
        balanceAfterZMW: lastBalance - args.amountZMW,
        referenceId: creditNoteId,
        transactionDate: new Date(now).toISOString().split('T')[0],
        createdAt: now,
      });

      // Audit log
      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'credit_note_created',
        performedBy: userId,
        relatedInvoiceId: args.invoiceId,
        relatedStudentId: invoice.studentId,
        amountZMW: args.amountZMW,
        notes: `${creditNoteNumber}: ${args.reason}`,
        createdAt: now,
      });

      return { creditNoteId, creditNoteNumber };
    });
  },
});

export const applyExistingCreditToInvoice = mutation({
  args: {
    creditNoteId: v.id('creditNotes'),
    targetInvoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.MANAGE_CREDIT_NOTES);
      if (!schoolId) throw new Error('School context required');

      const creditNote = await ctx.db.get(args.creditNoteId);
      if (!creditNote || creditNote.schoolId !== schoolId) {
        throw new Error('Credit note not found');
      }

      if (creditNote.status !== 'issued') {
        throw new Error('Credit note has already been applied or refunded');
      }

      const invoice = await ctx.db.get(args.targetInvoiceId);
      if (!invoice || invoice.schoolId !== schoolId) {
        throw new Error('Target invoice not found');
      }

      if (invoice.status === 'void' || invoice.status === 'paid') {
        throw new Error('Cannot apply credit to a voided or fully paid invoice');
      }

      const creditCents = Math.round(creditNote.amountZMW * 100);
      const balanceCents = Math.round(invoice.balanceZMW * 100);
      const appliedCents = Math.min(creditCents, balanceCents);
      const now = Date.now();

      // Update invoice
      const newPaidCents = Math.round(invoice.paidZMW * 100) + appliedCents;
      const newBalanceCents = Math.round(invoice.totalZMW * 100) - newPaidCents;
      const newStatus =
        newBalanceCents <= 0 ? ('paid' as const) : ('partial' as const);

      await ctx.db.patch(args.targetInvoiceId, {
        paidZMW: newPaidCents / 100,
        balanceZMW: Math.max(0, newBalanceCents / 100),
        status: newStatus,
        updatedAt: now,
      });

      // Mark credit note as applied
      await ctx.db.patch(args.creditNoteId, {
        status: 'applied',
        appliedToInvoiceId: args.targetInvoiceId,
      });

      // Ledger entry for the credit application
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
          description: `Applied credit ${creditNote.creditNoteNumber} to ${invoice.invoiceNumber}`,
          debitZMW: 0,
          creditZMW: appliedCents / 100,
          balanceAfterZMW: lastBalance - appliedCents / 100,
          referenceId: args.creditNoteId,
          transactionDate: new Date(now).toISOString().split('T')[0],
          createdAt: now,
        });
      }

      return { appliedZMW: appliedCents / 100 };
    });
  },
});

export const getGuardianCreditBalance = query({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return { availableCreditZMW: 0, creditNotes: [] };

      // Get all issued (unapplied) credit notes for this guardian
      const allCreditNotes = await ctx.db
        .query('creditNotes')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('guardianId'), args.guardianId))
        .collect();

      const issuedNotes = allCreditNotes.filter((cn) => cn.status === 'issued');
      const availableCreditCents = issuedNotes.reduce(
        (sum, cn) => sum + Math.round(cn.amountZMW * 100),
        0,
      );

      return {
        availableCreditZMW: availableCreditCents / 100,
        creditNotes: allCreditNotes,
      };
    });
  },
});

export const getCreditNotes = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const allNotes = await ctx.db
        .query('creditNotes')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .order('desc')
        .collect();

      const limited = args.limit ? allNotes.slice(0, args.limit) : allNotes;

      return Promise.all(
        limited.map(async (cn) => {
          const student = await ctx.db.get(cn.studentId);
          const invoice = await ctx.db.get(cn.invoiceId);
          const authoriser = cn.authorisedBy ? await ctx.db.get(cn.authorisedBy) : null;
          return {
            ...cn,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
            invoiceNumber: invoice?.invoiceNumber ?? 'N/A',
            authoriserName: authoriser
              ? `${(authoriser as any).firstName ?? ''} ${(authoriser as any).lastName ?? ''}`.trim()
              : 'System',
            remainingZMW: cn.status === 'issued' ? cn.amountZMW : 0,
          };
        }),
      );
    });
  },
});

export const getCreditNotesForStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const notes = await ctx.db
        .query('creditNotes')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('studentId'), args.studentId))
        .collect();

      return Promise.all(
        notes.map(async (cn) => {
          const invoice = await ctx.db.get(cn.invoiceId);
          return {
            ...cn,
            invoiceNumber: invoice?.invoiceNumber ?? 'N/A',
          };
        }),
      );
    });
  },
});

export const getCreditNotesForInvoice = query({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('creditNotes')
        .withIndex('by_invoice', (q) => q.eq('invoiceId', args.invoiceId))
        .filter((q) => q.eq(q.field('schoolId'), schoolId))
        .collect();
    });
  },
});
