import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getFeeStructuresForTerm = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('feeStructures')
        .withIndex('by_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();
    });
  },
});

export const getFeeStructuresForTermAndGrade = query({
  args: {
    termId: v.id('terms'),
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('feeStructures')
        .withIndex('by_term_grade', (q) =>
          q
            .eq('schoolId', schoolId)
            .eq('termId', args.termId)
            .eq('gradeId', args.gradeId),
        )
        .collect();
    });
  },
});

export const getFeeStructureForStudent = query({
  args: {
    studentId: v.id('students'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== schoolId) return [];

      const gradeId = student.currentGradeId;
      const boardingStatus = student.boardingStatus ?? 'day';

      const structures = await ctx.db
        .query('feeStructures')
        .withIndex('by_term_grade', (q) =>
          q
            .eq('schoolId', schoolId)
            .eq('termId', args.termId)
            .eq('gradeId', gradeId),
        )
        .collect();

      return structures.filter(
        (s) =>
          s.boardingStatus === 'all' || s.boardingStatus === boardingStatus,
      );
    });
  },
});

export const createFeeStructure = mutation({
  args: {
    termId: v.id('terms'),
    gradeId: v.optional(v.id('grades')),
    feeTypeId: v.string(),
    boardingStatus: v.union(
      v.literal('day'),
      v.literal('boarding'),
      v.literal('all'),
    ),
    amountZMW: v.number(),
    earlyPaymentDiscount: v.optional(
      v.object({
        deadlineDate: v.string(),
        discountPercent: v.number(),
      }),
    ),
    instalmentSchedule: v.optional(
      v.array(
        v.object({
          dueDate: v.string(),
          amountZMW: v.number(),
          label: v.string(),
        }),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      if (args.amountZMW < 0) {
        throw new Error('Amount must be non-negative');
      }

      // Validate instalment schedule totals match amount
      if (args.instalmentSchedule && args.instalmentSchedule.length > 0) {
        const instalmentTotal = args.instalmentSchedule.reduce(
          (sum, inst) => sum + Math.round(inst.amountZMW * 100),
          0,
        );
        const expectedTotal = Math.round(args.amountZMW * 100);
        if (instalmentTotal !== expectedTotal) {
          throw new Error(
            `Instalment total (${instalmentTotal / 100}) does not match fee amount (${args.amountZMW})`,
          );
        }
      }

      // Check for duplicates
      const existing = await ctx.db
        .query('feeStructures')
        .withIndex('by_term_grade_feetype', (q) =>
          q
            .eq('schoolId', schoolId)
            .eq('termId', args.termId)
            .eq('gradeId', args.gradeId)
            .eq('feeTypeId', args.feeTypeId),
        )
        .collect();

      const duplicate = existing.find(
        (s) =>
          s.boardingStatus === args.boardingStatus ||
          s.boardingStatus === 'all' ||
          args.boardingStatus === 'all',
      );

      if (duplicate) {
        throw new Error(
          'A fee structure already exists for this term, grade, fee type, and boarding status combination',
        );
      }

      const now = Date.now();
      const id = await ctx.db.insert('feeStructures', {
        schoolId,
        termId: args.termId,
        gradeId: args.gradeId,
        feeTypeId: args.feeTypeId,
        boardingStatus: args.boardingStatus,
        amountZMW: args.amountZMW,
        earlyPaymentDiscount: args.earlyPaymentDiscount,
        instalmentSchedule: args.instalmentSchedule,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'fee_structure_changed',
        performedBy: userId,
        amountZMW: args.amountZMW,
        newValue: JSON.stringify({ feeTypeId: args.feeTypeId, boardingStatus: args.boardingStatus, amountZMW: args.amountZMW }),
        notes: `Created fee structure: ${args.feeTypeId} — K${args.amountZMW}`,
        createdAt: now,
      });

      return id;
    });
  },
});

export const updateFeeStructure = mutation({
  args: {
    feeStructureId: v.id('feeStructures'),
    amountZMW: v.optional(v.number()),
    earlyPaymentDiscount: v.optional(
      v.object({
        deadlineDate: v.string(),
        discountPercent: v.number(),
      }),
    ),
    instalmentSchedule: v.optional(
      v.array(
        v.object({
          dueDate: v.string(),
          amountZMW: v.number(),
          label: v.string(),
        }),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const existing = await ctx.db.get(args.feeStructureId);
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error('Fee structure not found');
      }

      const amountZMW = args.amountZMW ?? existing.amountZMW;

      if (args.instalmentSchedule && args.instalmentSchedule.length > 0) {
        const instalmentTotal = args.instalmentSchedule.reduce(
          (sum, inst) => sum + Math.round(inst.amountZMW * 100),
          0,
        );
        const expectedTotal = Math.round(amountZMW * 100);
        if (instalmentTotal !== expectedTotal) {
          throw new Error(
            `Instalment total (${instalmentTotal / 100}) does not match fee amount (${amountZMW})`,
          );
        }
      }

      const now = Date.now();
      await ctx.db.patch(args.feeStructureId, {
        ...(args.amountZMW !== undefined && { amountZMW: args.amountZMW }),
        ...(args.earlyPaymentDiscount !== undefined && {
          earlyPaymentDiscount: args.earlyPaymentDiscount,
        }),
        ...(args.instalmentSchedule !== undefined && {
          instalmentSchedule: args.instalmentSchedule,
        }),
        ...(args.notes !== undefined && { notes: args.notes }),
        updatedAt: now,
      });

      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'fee_structure_changed',
        performedBy: userId,
        amountZMW: args.amountZMW ?? existing.amountZMW,
        previousValue: JSON.stringify({ amountZMW: existing.amountZMW }),
        newValue: JSON.stringify({ amountZMW: args.amountZMW ?? existing.amountZMW }),
        notes: `Updated fee structure: ${existing.feeTypeId}`,
        createdAt: now,
      });
    });
  },
});

export const deleteFeeStructure = mutation({
  args: {
    feeStructureId: v.id('feeStructures'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const existing = await ctx.db.get(args.feeStructureId);
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error('Fee structure not found');
      }

      // Check if any invoices reference this fee structure
      const invoicesWithFeeType = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', existing.termId),
        )
        .first();

      if (invoicesWithFeeType) {
        throw new Error(
          'Cannot delete fee structure: invoices exist for this term. Adjust the fee structure instead.',
        );
      }

      await ctx.db.delete(args.feeStructureId);
    });
  },
});

export const copyFeeStructureToTerm = mutation({
  args: {
    sourceTermId: v.id('terms'),
    targetTermId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      if (args.sourceTermId === args.targetTermId) {
        throw new Error('Source and target terms must be different');
      }

      // Check target term is empty
      const existingTarget = await ctx.db
        .query('feeStructures')
        .withIndex('by_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.targetTermId),
        )
        .first();

      if (existingTarget) {
        throw new Error(
          'Target term already has fee structures. Clear them first or use a different term.',
        );
      }

      const sourceStructures = await ctx.db
        .query('feeStructures')
        .withIndex('by_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.sourceTermId),
        )
        .collect();

      const now = Date.now();
      let count = 0;
      for (const structure of sourceStructures) {
        await ctx.db.insert('feeStructures', {
          schoolId,
          termId: args.targetTermId,
          gradeId: structure.gradeId,
          feeTypeId: structure.feeTypeId,
          boardingStatus: structure.boardingStatus,
          amountZMW: structure.amountZMW,
          earlyPaymentDiscount: structure.earlyPaymentDiscount,
          instalmentSchedule: structure.instalmentSchedule,
          notes: structure.notes,
          createdAt: now,
          updatedAt: now,
        });
        count++;
      }

      return { copiedCount: count };
    });
  },
});
