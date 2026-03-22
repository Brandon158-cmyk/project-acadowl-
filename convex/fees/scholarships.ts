import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getScholarships = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      const scholarships = await ctx.db
        .query('scholarships')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      return Promise.all(
        scholarships.map(async (s) => {
          const student = await ctx.db.get(s.studentId);
          return {
            ...s,
            studentName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
          };
        }),
      );
    });
  },
});

export const getActiveScholarshipsForStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      return ctx.db
        .query('scholarships')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) =>
          q.and(
            q.eq(q.field('schoolId'), schoolId),
            q.eq(q.field('isActive'), true),
          ),
        )
        .collect();
    });
  },
});

export const createScholarship = mutation({
  args: {
    studentId: v.id('students'),
    name: v.string(),
    provider: v.string(),
    discountType: v.union(
      v.literal('full'),
      v.literal('partial_percent'),
      v.literal('partial_fixed'),
    ),
    discountPercent: v.optional(v.number()),
    discountFixedZMW: v.optional(v.number()),
    applyToFeeTypes: v.array(v.string()),
    validFrom: v.string(),
    validTo: v.string(),
    notes: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId, role }) => {
      requirePermission(role, Permission.MANAGE_SCHOLARSHIPS);
      if (!schoolId) throw new Error('School context required');

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== schoolId) {
        throw new Error('Student not found');
      }

      if (
        args.discountType === 'partial_percent' &&
        (args.discountPercent === undefined || args.discountPercent <= 0 || args.discountPercent > 100)
      ) {
        throw new Error('Partial percent scholarship requires a valid discount percentage (1-100)');
      }

      if (
        args.discountType === 'partial_fixed' &&
        (args.discountFixedZMW === undefined || args.discountFixedZMW <= 0)
      ) {
        throw new Error('Partial fixed scholarship requires a valid fixed amount');
      }

      const scholarshipId = await ctx.db.insert('scholarships', {
        schoolId,
        studentId: args.studentId,
        name: args.name,
        provider: args.provider,
        discountType: args.discountType,
        discountPercent: args.discountPercent,
        discountFixedZMW: args.discountFixedZMW,
        applyToFeeTypes: args.applyToFeeTypes,
        validFrom: args.validFrom,
        validTo: args.validTo,
        notes: args.notes,
        documentUrl: args.documentUrl,
        isActive: true,
        createdAt: Date.now(),
      });

      // Audit log
      await ctx.db.insert('feeAuditLog', {
        schoolId,
        action: 'scholarship_applied',
        performedBy: userId,
        relatedStudentId: args.studentId,
        notes: `Scholarship "${args.name}" from ${args.provider} — ${args.discountType}`,
        createdAt: Date.now(),
      });

      return scholarshipId;
    });
  },
});

export const updateScholarship = mutation({
  args: {
    scholarshipId: v.id('scholarships'),
    name: v.optional(v.string()),
    provider: v.optional(v.string()),
    discountType: v.optional(
      v.union(
        v.literal('full'),
        v.literal('partial_percent'),
        v.literal('partial_fixed'),
      ),
    ),
    discountPercent: v.optional(v.number()),
    discountFixedZMW: v.optional(v.number()),
    applyToFeeTypes: v.optional(v.array(v.string())),
    validFrom: v.optional(v.string()),
    validTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SCHOLARSHIPS);
      if (!schoolId) throw new Error('School context required');

      const scholarship = await ctx.db.get(args.scholarshipId);
      if (!scholarship || scholarship.schoolId !== schoolId) {
        throw new Error('Scholarship not found');
      }

      const { scholarshipId, ...updates } = args;
      const patch: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          patch[key] = value;
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(args.scholarshipId, patch);
      }
    });
  },
});

export const deactivateScholarship = mutation({
  args: {
    scholarshipId: v.id('scholarships'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SCHOLARSHIPS);
      if (!schoolId) throw new Error('School context required');

      const scholarship = await ctx.db.get(args.scholarshipId);
      if (!scholarship || scholarship.schoolId !== schoolId) {
        throw new Error('Scholarship not found');
      }

      await ctx.db.patch(args.scholarshipId, { isActive: false });
    });
  },
});
