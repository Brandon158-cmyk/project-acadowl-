import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { normalizeBoardingStatus } from './_helpers';

// Internal mutation called during student enrollment to generate a registration fee invoice
export const generateRegistrationFeeInvoice = internalMutation({
  args: {
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    termId: v.id('terms'),
    issuedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) throw new Error('School not found');

    const feeTypes = school.feeTypes ?? [];
    const registrationFeeType = feeTypes.find(
      (ft) => ft.name === 'Registration Fee' && ft.isActive && !ft.isRecurring,
    );

    if (!registrationFeeType) {
      // No registration fee type configured — skip silently
      return null;
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error('Student not found');

    const boardingStatus = normalizeBoardingStatus(student.boardingStatus);

    // Find the fee structure for registration fee
    const structures = await ctx.db
      .query('feeStructures')
      .withIndex('by_term_grade_feetype', (q) =>
        q
          .eq('schoolId', args.schoolId)
          .eq('termId', args.termId)
          .eq('gradeId', student.currentGradeId)
          .eq('feeTypeId', registrationFeeType.id),
      )
      .collect();

    const structure = structures.find(
      (s) => s.boardingStatus === 'all' || s.boardingStatus === boardingStatus,
    );

    if (!structure) {
      // No fee structure for registration fee — skip silently
      return null;
    }

    // Generate invoice number
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_school_key', (q) =>
        q.eq('schoolId', args.schoolId).eq('key', 'invoice_number'),
      )
      .unique();

    let nextNumber = 1;
    if (counter) {
      nextNumber = counter.value + 1;
      await ctx.db.patch(counter._id, { value: nextNumber });
    } else {
      await ctx.db.insert('counters', {
        schoolId: args.schoolId,
        key: 'invoice_number',
        value: nextNumber,
      });
    }

    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;
    const amountCents = Math.round(structure.amountZMW * 100);
    const now = Date.now();

    // Due date: 14 days from now for registration fees
    const dueDate = now + 14 * 24 * 60 * 60 * 1000;

    const invoiceId = await ctx.db.insert('invoices', {
      schoolId: args.schoolId,
      studentId: args.studentId,
      termId: args.termId,
      invoiceNumber,
      lineItems: [
        {
          description: `Registration Fee - ${registrationFeeType.name}`,
          quantity: 1,
          unitPriceZMW: structure.amountZMW,
          totalZMW: structure.amountZMW,
          feeTypeId: registrationFeeType.id,
          vatCategory: registrationFeeType.zraVatCategory,
          vatZMW: 0, // Education fees typically VAT exempt in Zambia
        },
      ],
      subtotalZMW: structure.amountZMW,
      vatZMW: 0,
      discountZMW: 0,
      siblingDiscountZMW: 0,
      totalZMW: structure.amountZMW,
      paidZMW: 0,
      balanceZMW: structure.amountZMW,
      status: 'draft',
      dueDate,
      zraStatus: 'pending',
      issuedBy: args.issuedBy,
      createdAt: now,
      updatedAt: now,
    });

    return invoiceId;
  },
});
