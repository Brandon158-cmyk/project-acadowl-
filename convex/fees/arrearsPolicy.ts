import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';
import { classifyArrears } from './arrears';

export const updateArrearsPolicy = mutation({
  args: {
    // Backend field names
    reminderScheduleDays: v.optional(v.array(v.number())),
    requireFullPaymentForPromotion: v.optional(v.boolean()),
    gracePeriodDays: v.optional(v.number()),
    arrangementNote: v.optional(v.string()),
    // Frontend field names (aliases)
    reminderDays: v.optional(v.array(v.number())),
    requireFeesClearedForPromotion: v.optional(v.boolean()),
    enableAutomaticReminders: v.optional(v.boolean()),
    // Shared field names
    blockExamAccessAtDays: v.optional(v.number()),
    holdReportCardAtDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      if (!schoolId) throw new Error('School context required');

      // Resolve aliased fields
      const reminderScheduleDays = args.reminderScheduleDays ?? args.reminderDays ?? [];
      const requireFullPayment = args.requireFullPaymentForPromotion ?? args.requireFeesClearedForPromotion ?? false;

      await ctx.db.patch(schoolId, {
        arrearsPolicy: {
          reminderScheduleDays,
          blockExamAccessAtDays: args.blockExamAccessAtDays,
          holdReportCardAtDays: args.holdReportCardAtDays,
          requireFullPaymentForPromotion: requireFullPayment,
          gracePeriodDays: args.gracePeriodDays ?? 0,
          arrangementNote: args.arrangementNote,
          enableAutomaticReminders: args.enableAutomaticReminders,
        },
        updatedAt: Date.now(),
      });
    });
  },
});

export const getArrearsPolicy = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return null;
      const school = await ctx.db.get(schoolId);
      const policy = school?.arrearsPolicy;
      if (!policy) return null;

      return {
        ...policy,
        // Aliased field names for frontend compatibility
        reminderDays: policy.reminderScheduleDays ?? [],
        requireFeesClearedForPromotion: policy.requireFullPaymentForPromotion ?? false,
        enableAutomaticReminders: (policy as any).enableAutomaticReminders ?? true,
      };
    });
  },
});

// Check if a student is eligible for exam access based on arrears policy
export const isEligibleForExamAccess = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return { eligible: true, reason: null };

      const school = await ctx.db.get(schoolId);
      if (!school?.arrearsPolicy?.blockExamAccessAtDays) {
        return { eligible: true, reason: null };
      }

      const now = Date.now();
      const threshold = school.arrearsPolicy.blockExamAccessAtDays;

      // Find unpaid invoices for this student
      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) =>
          q.and(
            q.eq(q.field('schoolId'), schoolId),
            q.neq(q.field('status'), 'void'),
            q.neq(q.field('status'), 'paid'),
            q.gt(q.field('balanceZMW'), 0),
          ),
        )
        .collect();

      for (const inv of invoices) {
        const { daysOverdue } = classifyArrears(inv.dueDate, now);
        if (daysOverdue >= threshold) {
          return {
            eligible: false,
            reason: `Outstanding balance of K${inv.balanceZMW.toFixed(2)} is ${daysOverdue} days overdue (policy blocks at ${threshold} days)`,
          };
        }
      }

      return { eligible: true, reason: null };
    });
  },
});

// Check if a student's report card should be held
export const isReportCardHeld = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return { held: false, reason: null };

      const school = await ctx.db.get(schoolId);
      if (!school?.arrearsPolicy?.holdReportCardAtDays) {
        return { held: false, reason: null };
      }

      const now = Date.now();
      const threshold = school.arrearsPolicy.holdReportCardAtDays;

      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
        .filter((q) =>
          q.and(
            q.eq(q.field('schoolId'), schoolId),
            q.neq(q.field('status'), 'void'),
            q.neq(q.field('status'), 'paid'),
            q.gt(q.field('balanceZMW'), 0),
          ),
        )
        .collect();

      for (const inv of invoices) {
        const { daysOverdue } = classifyArrears(inv.dueDate, now);
        if (daysOverdue >= threshold) {
          return {
            held: true,
            reason: `Outstanding balance of K${inv.balanceZMW.toFixed(2)} is ${daysOverdue} days overdue (policy holds at ${threshold} days)`,
          };
        }
      }

      return { held: false, reason: null };
    });
  },
});
