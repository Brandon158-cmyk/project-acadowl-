import { v } from 'convex/values';
import { mutation, query, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';
import { getPrimaryGuardianId, normalizeBoardingStatus } from './_helpers';

const BATCH_SIZE = 50;

export const startBulkInvoiceRun = mutation({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.CREATE_INVOICE);
      if (!schoolId) throw new Error('School context required');

      // Count active students
      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
        .collect();

      if (students.length === 0) {
        throw new Error('No active students found');
      }

      const now = Date.now();
      const runId = await ctx.db.insert('invoiceRuns', {
        schoolId,
        termId: args.termId,
        triggeredBy: userId,
        status: 'pending',
        totalStudents: students.length,
        processed: 0,
        successful: 0,
        skipped: 0,
        errored: 0,
        errors: [],
        startedAt: now,
        createdAt: now,
      });

      // Schedule the first batch
      await ctx.scheduler.runAfter(0, internal.fees.bulkInvoice.processBatch, {
        invoiceRunId: runId,
        offset: 0,
      });

      return runId;
    });
  },
});

export const processBatch = internalMutation({
  args: {
    invoiceRunId: v.id('invoiceRuns'),
    offset: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.invoiceRunId);
    if (!run) throw new Error('Invoice run not found');
    if (run.status === 'failed') return;

    // Mark as running on first batch
    if (run.status === 'pending') {
      await ctx.db.patch(args.invoiceRunId, { status: 'running' });
    }

    // Get batch of students
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', run.schoolId))
      .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
      .collect();

    const batch = students.slice(args.offset, args.offset + BATCH_SIZE);

    if (batch.length === 0) {
      // All done
      await ctx.db.patch(args.invoiceRunId, {
        status: 'complete',
        completedAt: Date.now(),
      });
      return;
    }

    let successful = run.successful;
    let skipped = run.skipped;
    let errored = run.errored;
    const errors = [...run.errors];

    for (const student of batch) {
      try {
        // Call the invoice generator directly inline to stay within one mutation
        const result = await generateInvoiceForStudentInline(
          ctx,
          run.schoolId,
          student._id,
          run.termId,
          run.triggeredBy,
        );

        if (result.skipped) {
          skipped++;
        } else {
          successful++;
        }
      } catch (err) {
        errored++;
        errors.push({
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const processed = args.offset + batch.length;

    await ctx.db.patch(args.invoiceRunId, {
      processed,
      successful,
      skipped,
      errored,
      errors,
    });

    // Schedule next batch if more students remain
    if (processed < run.totalStudents) {
      await ctx.scheduler.runAfter(0, internal.fees.bulkInvoice.processBatch, {
        invoiceRunId: args.invoiceRunId,
        offset: processed,
      });
    } else {
      await ctx.db.patch(args.invoiceRunId, {
        status: 'complete',
        completedAt: Date.now(),
      });
    }
  },
});

export const getInvoiceRunStatus = query({
  args: {
    invoiceRunId: v.id('invoiceRuns'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;
      const run = await ctx.db.get(args.invoiceRunId);
      if (!run || run.schoolId !== schoolId) return null;
      return run;
    });
  },
});

export const getInvoiceRuns = query({
  args: {
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      if (args.termId) {
        return ctx.db
          .query('invoiceRuns')
          .withIndex('by_school_term', (q) =>
            q.eq('schoolId', schoolId).eq('termId', args.termId!),
          )
          .collect();
      }

      return ctx.db
        .query('invoiceRuns')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();
    });
  },
});

// Inline invoice generation for use within bulkInvoice processBatch
// This avoids calling internal mutations from within a mutation (which is not allowed)
async function generateInvoiceForStudentInline(
  ctx: any,
  schoolId: any,
  studentId: any,
  termId: any,
  issuedBy: any,
): Promise<{ skipped: boolean; reason?: string; invoiceId?: any }> {
  const student = await ctx.db.get(studentId);
  if (!student || student.schoolId !== schoolId) {
    return { skipped: true, reason: 'Student not found' };
  }

  if (student.enrollmentStatus !== 'active') {
    return { skipped: true, reason: 'Student is not active' };
  }

  // Check for existing invoice this term
  const existingInvoice = await ctx.db
    .query('invoices')
    .withIndex('by_student_term', (q: any) =>
      q.eq('studentId', studentId).eq('termId', termId),
    )
    .first();

  if (existingInvoice && existingInvoice.status !== 'void') {
    return { skipped: true, reason: 'Invoice already exists for this term' };
  }

  const school = await ctx.db.get(schoolId);
  if (!school) throw new Error('School not found');

  const feeTypes = school.feeTypes ?? [];
  const boardingStatus = normalizeBoardingStatus(student.boardingStatus);
  const primaryGuardianId = getPrimaryGuardianId(student);

  // Load fee structures
  const structures = await ctx.db
    .query('feeStructures')
    .withIndex('by_term_grade', (q: any) =>
      q.eq('schoolId', schoolId).eq('termId', termId).eq('gradeId', student.currentGradeId),
    )
    .collect();

  const schoolWideStructures = await ctx.db
    .query('feeStructures')
    .withIndex('by_term_grade', (q: any) =>
      q.eq('schoolId', schoolId).eq('termId', termId).eq('gradeId', undefined),
    )
    .collect();

  const applicableStructures = [...structures, ...schoolWideStructures].filter(
    (s: any) => s.boardingStatus === 'all' || s.boardingStatus === boardingStatus,
  );

  if (applicableStructures.length === 0) {
    return { skipped: true, reason: 'No fee structures found' };
  }

  const term = await ctx.db.get(termId);
  if (!term) throw new Error('Term not found');

  const { calculateProrationFactor, applyProration } = await import('./proration');
  const prorationFactor = calculateProrationFactor(
    student.enrolledAt ?? term.startDate,
    term.startDate,
    term.endDate,
  );

  // Build line items (simplified for bulk — no scholarship/sibling in this inline version,
  // those are handled by the full generateInvoiceForStudent internal mutation)
  const lineItems: any[] = [];
  let subtotalCents = 0;
  let vatCents = 0;

  for (const structure of applicableStructures) {
    const feeType = feeTypes.find((ft: any) => ft.id === structure.feeTypeId);
    if (!feeType || !feeType.isActive) continue;

    const shouldProrate = feeType.isRecurring && prorationFactor < 1;
    const proratedAmount = shouldProrate
      ? applyProration(structure.amountZMW, prorationFactor)
      : structure.amountZMW;

    const lineCents = Math.round(proratedAmount * 100);
    let lineVat = 0;
    if (feeType.zraVatCategory === 'standard') {
      lineVat = Math.round(lineCents * 0.16);
    }

    lineItems.push({
      description: feeType.name,
      quantity: 1,
      unitPriceZMW: proratedAmount,
      totalZMW: lineCents / 100,
      feeTypeId: structure.feeTypeId,
      vatCategory: feeType.zraVatCategory,
      vatZMW: lineVat / 100,
      ...(shouldProrate && {
        isProrated: true,
        prorationNote: `Prorated at ${Math.round(prorationFactor * 100)}%`,
      }),
    });

    subtotalCents += lineCents;
    vatCents += lineVat;
  }

  if (lineItems.length === 0) {
    return { skipped: true, reason: 'No applicable fee items' };
  }

  const totalCents = subtotalCents + vatCents;

  // Generate invoice number
  const counter = await ctx.db
    .query('counters')
    .withIndex('by_school_key', (q: any) =>
      q.eq('schoolId', schoolId).eq('key', 'invoice_number'),
    )
    .unique();

  let nextNumber = 1;
  if (counter) {
    nextNumber = counter.value + 1;
    await ctx.db.patch(counter._id, { value: nextNumber });
  } else {
    await ctx.db.insert('counters', {
      schoolId,
      key: 'invoice_number',
      value: nextNumber,
    });
  }

  const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

  // Due date from first instalment or default 30 days
  const firstInstalment = applicableStructures.find(
    (s: any) => s.instalmentSchedule && s.instalmentSchedule.length > 0,
  );
  const dueDate = firstInstalment?.instalmentSchedule?.[0]
    ? new Date(firstInstalment.instalmentSchedule[0].dueDate).getTime()
    : Date.now() + 30 * 24 * 60 * 60 * 1000;

  const now = Date.now();
  const invoiceId = await ctx.db.insert('invoices', {
    schoolId,
    studentId,
    guardianId: primaryGuardianId ?? undefined,
    termId,
    invoiceNumber,
    lineItems,
    subtotalZMW: subtotalCents / 100,
    vatZMW: vatCents / 100,
    discountZMW: 0,
    siblingDiscountZMW: 0,
    totalZMW: totalCents / 100,
    paidZMW: 0,
    balanceZMW: totalCents / 100,
    status: 'draft',
    dueDate,
    prorationFactor: prorationFactor < 1 ? prorationFactor : undefined,
    zraStatus: 'pending',
    issuedBy,
    createdAt: now,
    updatedAt: now,
  });

  // Create ledger entry
  if (primaryGuardianId) {
    const prevEntries = await ctx.db
      .query('guardianLedger')
      .withIndex('by_guardian_student', (q: any) =>
        q.eq('guardianId', primaryGuardianId).eq('studentId', studentId),
      )
      .collect();

    const lastBalance =
      prevEntries.length > 0
        ? prevEntries[prevEntries.length - 1].balanceAfterZMW
        : 0;

    await ctx.db.insert('guardianLedger', {
      schoolId,
      guardianId: primaryGuardianId,
      studentId,
      termId,
      entryType: 'invoice',
      description: `Invoice ${invoiceNumber}`,
      debitZMW: totalCents / 100,
      creditZMW: 0,
      balanceAfterZMW: lastBalance + totalCents / 100,
      referenceId: invoiceId,
      transactionDate: new Date(now).toISOString().split('T')[0],
      createdAt: now,
    });
  }

  return { skipped: false, invoiceId };
}
