import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

// Idempotent payment webhook processor
// Called by Next.js API routes after validating HMAC/callback tokens
export const processPaymentWebhook = internalMutation({
  args: {
    schoolId: v.id('schools'),
    source: v.union(v.literal('airtel_money'), v.literal('mtn_momo')),
    transactionId: v.string(),
    payerPhone: v.string(),
    amountZMW: v.number(),
    receivedAt: v.number(),
    rawPayload: v.string(),
    invoiceReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Idempotency check: skip if we've already processed this transaction
    const existingPayment = await ctx.db
      .query('payments')
      .withIndex('by_mobile_money_ref', (q) =>
        q.eq('mobileMoneyReference', args.transactionId),
      )
      .first();

    if (existingPayment) {
      return { duplicate: true, paymentId: existingPayment._id };
    }

    // Try to match to an invoice
    let invoice = null;
    if (args.invoiceReference) {
      // Try matching by invoice number
      invoice = await ctx.db
        .query('invoices')
        .withIndex('by_invoice_number', (q) =>
          q
            .eq('schoolId', args.schoolId)
            .eq('invoiceNumber', args.invoiceReference!),
        )
        .first();
    }

    // If no invoice reference or no match, try matching by phone → guardian → student
    if (!invoice) {
      // Search guardians by phone
      const guardians = await ctx.db
        .query('guardians')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .filter((q) => q.eq(q.field('phone'), args.payerPhone))
        .collect();

      if (guardians.length === 1) {
        // Find unpaid invoices for this guardian's students
        const allStudents = await ctx.db
          .query('students')
          .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
          .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
          .collect();

        // Filter to students linked to this guardian
        const students = allStudents.filter((s) => {
          const links = s.guardianLinks ?? [];
          return links.some((l) => l.guardianId === guardians[0]._id);
        });

        for (const student of students) {
          const unpaidInvoice = await ctx.db
            .query('invoices')
            .withIndex('by_student', (q) => q.eq('studentId', student._id))
            .filter((q) =>
              q.and(
                q.eq(q.field('schoolId'), args.schoolId),
                q.or(
                  q.eq(q.field('status'), 'sent'),
                  q.eq(q.field('status'), 'partial'),
                  q.eq(q.field('status'), 'overdue'),
                ),
              ),
            )
            .first();

          if (unpaidInvoice) {
            invoice = unpaidInvoice;
            break;
          }
        }
      }
    }

    const now = Date.now();

    // If no invoice found, create unallocated payment
    if (!invoice) {
      const unallocatedId = await ctx.db.insert('unallocatedPayments', {
        schoolId: args.schoolId,
        source: args.source,
        transactionId: args.transactionId,
        payerPhone: args.payerPhone,
        amountZMW: args.amountZMW,
        receivedAt: args.receivedAt,
        rawPayload: args.rawPayload,
        status: 'unresolved',
      });

      return { matched: false, unallocatedId };
    }

    // Matched — create payment record
    const amountCents = Math.round(args.amountZMW * 100);
    const balanceCents = Math.round(invoice.balanceZMW * 100);
    const appliedCents = Math.min(amountCents, balanceCents);
    const overpaymentCents = Math.max(0, amountCents - balanceCents);

    // Generate receipt number
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_school_key', (q) =>
        q.eq('schoolId', args.schoolId).eq('key', 'receipt_number'),
      )
      .unique();

    let nextNumber = 1;
    if (counter) {
      nextNumber = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextNumber });
    } else {
      await ctx.db.insert('counters', {
        schoolId: args.schoolId,
        key: 'receipt_number',
        value: nextNumber,
      });
    }

    const receiptNumber = `RCP-${String(nextNumber).padStart(6, '0')}`;

    const paymentId = await ctx.db.insert('payments', {
      schoolId: args.schoolId,
      invoiceId: invoice._id,
      studentId: invoice.studentId,
      amountZMW: appliedCents / 100,
      method: args.source,
      reference: args.invoiceReference,
      mobileMoneyReference: args.transactionId,
      payerPhone: args.payerPhone,
      receiptNumber,
      status: 'confirmed',
      receivedAt: args.receivedAt,
      confirmedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Update invoice
    const newPaidCents = Math.round(invoice.paidZMW * 100) + appliedCents;
    const newBalanceCents = Math.round(invoice.totalZMW * 100) - newPaidCents;
    const newStatus =
      newBalanceCents <= 0 ? ('paid' as const) : ('partial' as const);

    await ctx.db.patch(invoice._id, {
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
        schoolId: args.schoolId,
        guardianId: invoice.guardianId,
        studentId: invoice.studentId,
        termId: invoice.termId,
        entryType: 'payment',
        description: `${args.source === 'airtel_money' ? 'Airtel Money' : 'MTN MoMo'} payment ${receiptNumber}`,
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
      schoolId: args.schoolId,
      action: 'payment_recorded',
      performedBy: invoice.issuedBy!,
      relatedInvoiceId: invoice._id,
      relatedPaymentId: paymentId,
      relatedStudentId: invoice.studentId,
      amountZMW: appliedCents / 100,
      notes: `Mobile money (${args.source}): ${args.transactionId}`,
      createdAt: now,
    });

    // Handle overpayment
    if (overpaymentCents > 0 && invoice.guardianId) {
      const cnCounter = await ctx.db
        .query('counters')
        .withIndex('by_school_key', (q) =>
          q.eq('schoolId', args.schoolId).eq('key', 'credit_note_number'),
        )
        .unique();

      let cnNumber = 1;
      if (cnCounter) {
        cnNumber = cnCounter.value + 1;
        await ctx.db.patch(cnCounter._id, { value: cnNumber });
      } else {
        await ctx.db.insert('counters', {
          schoolId: args.schoolId,
          key: 'credit_note_number',
          value: cnNumber,
        });
      }

      await ctx.db.insert('creditNotes', {
        schoolId: args.schoolId,
        invoiceId: invoice._id,
        studentId: invoice.studentId,
        guardianId: invoice.guardianId,
        creditNoteNumber: `CN-${String(cnNumber).padStart(6, '0')}`,
        amountZMW: overpaymentCents / 100,
        reason: 'Mobile money overpayment',
        type: 'overpayment_refund',
        authorisedBy: invoice.issuedBy!,
        status: 'issued',
        createdAt: now,
      });
    }

    return { matched: true, paymentId, receiptNumber };
  },
});
