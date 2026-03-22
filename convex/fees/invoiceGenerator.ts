import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { calculateProrationFactor, applyProration } from './proration';
import { getPrimaryGuardianId, normalizeBoardingStatus } from './_helpers';

// Generate a unique invoice number using the counters table
async function generateInvoiceNumber(
  ctx: any,
  schoolId: any,
): Promise<string> {
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

  return `INV-${String(nextNumber).padStart(6, '0')}`;
}

// Core invoice generation for a single student
// This is the 15-step flow described in the sprint spec (ISSUE-095)
export const generateInvoiceForStudent = internalMutation({
  args: {
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    termId: v.id('terms'),
    issuedBy: v.id('users'),
    invoiceRunId: v.optional(v.id('invoiceRuns')),
  },
  handler: async (ctx, args) => {
    // Step 1: Load student
    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== args.schoolId) {
      throw new Error('Student not found or does not belong to this school');
    }

    if (student.enrollmentStatus !== 'active') {
      return { skipped: true, reason: 'Student is not active' };
    }

    // Step 2: Check for existing invoice this term
    const existingInvoice = await ctx.db
      .query('invoices')
      .withIndex('by_student_term', (q) =>
        q.eq('studentId', args.studentId).eq('termId', args.termId),
      )
      .first();

    if (existingInvoice && existingInvoice.status !== 'void') {
      return { skipped: true, reason: 'Invoice already exists for this term' };
    }

    // Step 3: Load school + fee types
    const school = await ctx.db.get(args.schoolId);
    if (!school) throw new Error('School not found');

    const feeTypes = school.feeTypes ?? [];
    const boardingStatus = normalizeBoardingStatus(student.boardingStatus);
    const primaryGuardianId = getPrimaryGuardianId(student);

    // Step 4: Load fee structures for this term + grade
    const structures = await ctx.db
      .query('feeStructures')
      .withIndex('by_term_grade', (q) =>
        q
          .eq('schoolId', args.schoolId)
          .eq('termId', args.termId)
          .eq('gradeId', student.currentGradeId),
      )
      .collect();

    // Also get school-wide structures (no grade)
    const schoolWideStructures = await ctx.db
      .query('feeStructures')
      .withIndex('by_term_grade', (q) =>
        q
          .eq('schoolId', args.schoolId)
          .eq('termId', args.termId)
          .eq('gradeId', undefined),
      )
      .collect();

    const allStructures = [...structures, ...schoolWideStructures];

    // Filter by boarding status
    const applicableStructures = allStructures.filter(
      (s) => s.boardingStatus === 'all' || s.boardingStatus === boardingStatus,
    );

    if (applicableStructures.length === 0) {
      return { skipped: true, reason: 'No fee structures found for this student' };
    }

    // Step 5: Load term dates for proration
    const term = await ctx.db.get(args.termId);
    if (!term) throw new Error('Term not found');

    const termStartDate = term.startDate;
    const termEndDate = term.endDate;
    const enrollmentDate = student.enrolledAt ?? termStartDate;

    const prorationFactor = calculateProrationFactor(
      enrollmentDate,
      termStartDate,
      termEndDate,
    );

    // Step 6: Load active scholarships for this student
    const scholarships = await ctx.db
      .query('scholarships')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect();

    const activeScholarships = scholarships.filter((s) => s.isActive);

    // Step 7: Calculate sibling discount
    let siblingDiscountPercent = 0;
    if (school.siblingDiscountRules && school.siblingDiscountRules.length > 0 && primaryGuardianId) {
      // Count active students for this guardian
      const allSchoolStudents = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
        .collect();

      const siblings = allSchoolStudents.filter((s) => {
        const gId = getPrimaryGuardianId(s);
        return gId !== null && (gId as string) === (primaryGuardianId as string);
      });

      const siblingIndex = siblings
        .sort((a, b) => (a.enrolledAt ?? 0) - (b.enrolledAt ?? 0))
        .findIndex((s) => s._id === args.studentId);

      // Find the applicable discount rule
      const rule = school.siblingDiscountRules.find(
        (r) => r.childIndex === siblingIndex,
      );
      if (rule) {
        siblingDiscountPercent = rule.discountPercent;
      }
    }

    // Step 8: Build line items
    const lineItems: Array<{
      description: string;
      quantity: number;
      unitPriceZMW: number;
      totalZMW: number;
      feeTypeId: string;
      vatCategory: 'exempt' | 'standard' | 'zero_rated' | 'levy';
      vatZMW: number;
      isProrated?: boolean;
      prorationNote?: string;
    }> = [];

    let subtotalCents = 0;
    let vatCents = 0;
    let siblingDiscountCents = 0;
    let scholarshipDiscountCents = 0;

    for (const structure of applicableStructures) {
      const feeType = feeTypes.find((ft) => ft.id === structure.feeTypeId);
      if (!feeType || !feeType.isActive) continue;

      // Only apply proration to recurring fees
      const shouldProrate = feeType.isRecurring && prorationFactor < 1;
      const baseAmountZMW = structure.amountZMW;
      const proratedAmountZMW = shouldProrate
        ? applyProration(baseAmountZMW, prorationFactor)
        : baseAmountZMW;

      // Apply scholarship discount
      let scholarshipDiscount = 0;
      for (const scholarship of activeScholarships) {
        if (scholarship.applyToFeeTypes.includes(structure.feeTypeId)) {
          if (scholarship.discountType === 'full') {
            scholarshipDiscount = Math.round(proratedAmountZMW * 100);
          } else if (
            scholarship.discountType === 'partial_percent' &&
            scholarship.discountPercent
          ) {
            scholarshipDiscount = Math.round(
              proratedAmountZMW * 100 * (scholarship.discountPercent / 100),
            );
          } else if (
            scholarship.discountType === 'partial_fixed' &&
            scholarship.discountFixedZMW
          ) {
            scholarshipDiscount = Math.round(scholarship.discountFixedZMW * 100);
          }
          break; // Only one scholarship per fee type
        }
      }

      // Apply sibling discount (only to eligible fee types)
      let siblingDiscount = 0;
      if (siblingDiscountPercent > 0) {
        const siblingRules = school.siblingDiscountRules ?? [];
        const applicableRule = siblingRules.find((r) =>
          !r.applyToFeeTypes ||
          r.applyToFeeTypes.length === 0 ||
          r.applyToFeeTypes.includes(structure.feeTypeId),
        );
        if (applicableRule) {
          siblingDiscount = Math.round(
            proratedAmountZMW * 100 * (siblingDiscountPercent / 100),
          );
        }
      }

      const afterDiscountsCents =
        Math.round(proratedAmountZMW * 100) - scholarshipDiscount - siblingDiscount;
      const lineAmountCents = Math.max(0, afterDiscountsCents);

      // Calculate VAT (standard rate 16% in Zambia for non-exempt items)
      let lineVatCents = 0;
      if (feeType.zraVatCategory === 'standard') {
        lineVatCents = Math.round(lineAmountCents * 0.16);
      }

      lineItems.push({
        description: feeType.name,
        quantity: 1,
        unitPriceZMW: proratedAmountZMW,
        totalZMW: lineAmountCents / 100,
        feeTypeId: structure.feeTypeId,
        vatCategory: feeType.zraVatCategory,
        vatZMW: lineVatCents / 100,
        ...(shouldProrate && {
          isProrated: true,
          prorationNote: `Prorated at ${Math.round(prorationFactor * 100)}% (${Math.round(prorationFactor * ((termEndDate - termStartDate) / (24 * 60 * 60 * 1000)))} days remaining)`,
        }),
      });

      subtotalCents += lineAmountCents;
      vatCents += lineVatCents;
      siblingDiscountCents += siblingDiscount;
      scholarshipDiscountCents += scholarshipDiscount;
    }

    if (lineItems.length === 0) {
      return { skipped: true, reason: 'No applicable fee items for this student' };
    }

    // Step 9: Calculate totals
    const totalCents = subtotalCents + vatCents;
    const discountCents = scholarshipDiscountCents;

    // Step 10: Calculate due date
    const firstInstalment = applicableStructures.find(
      (s) => s.instalmentSchedule && s.instalmentSchedule.length > 0,
    );
    let dueDate: number;
    if (firstInstalment?.instalmentSchedule?.[0]) {
      dueDate = new Date(firstInstalment.instalmentSchedule[0].dueDate).getTime();
    } else {
      // Default: 30 days from now
      dueDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    // Step 11: Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(ctx, args.schoolId);

    // Step 12: Create the invoice
    const now = Date.now();
    const invoiceId = await ctx.db.insert('invoices', {
      schoolId: args.schoolId,
      studentId: args.studentId,
      guardianId: primaryGuardianId ?? undefined,
      termId: args.termId,
      invoiceNumber,
      lineItems,
      subtotalZMW: subtotalCents / 100,
      vatZMW: vatCents / 100,
      discountZMW: discountCents / 100,
      siblingDiscountZMW: siblingDiscountCents / 100,
      totalZMW: totalCents / 100,
      paidZMW: 0,
      balanceZMW: totalCents / 100,
      status: 'draft',
      dueDate,
      prorationFactor: prorationFactor < 1 ? prorationFactor : undefined,
      zraStatus: 'pending',
      issuedBy: args.issuedBy,
      createdAt: now,
      updatedAt: now,
    });

    // Step 13: Create ledger entry
    if (primaryGuardianId) {
      const prevEntries = await ctx.db
        .query('guardianLedger')
        .withIndex('by_guardian_student', (q) =>
          q
            .eq('guardianId', primaryGuardianId)
            .eq('studentId', args.studentId),
        )
        .collect();

      const lastBalance = prevEntries.length > 0
        ? prevEntries[prevEntries.length - 1].balanceAfterZMW
        : 0;

      await ctx.db.insert('guardianLedger', {
        schoolId: args.schoolId,
        guardianId: primaryGuardianId,
        studentId: args.studentId,
        termId: args.termId,
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

    return {
      skipped: false,
      invoiceId,
      invoiceNumber,
      totalZMW: totalCents / 100,
    };
  },
});
