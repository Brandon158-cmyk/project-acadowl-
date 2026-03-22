import { v } from 'convex/values';
import { query, internalMutation } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';

// Pure function: classify arrears aging bucket
export function classifyArrears(
  dueDate: number,
  now: number,
): { bucket: string; daysOverdue: number } {
  const diffMs = now - dueDate;
  if (diffMs <= 0) return { bucket: 'current', daysOverdue: 0 };

  const daysOverdue = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysOverdue <= 7) return { bucket: '1-7 days', daysOverdue };
  if (daysOverdue <= 14) return { bucket: '8-14 days', daysOverdue };
  if (daysOverdue <= 21) return { bucket: '15-21 days', daysOverdue };
  if (daysOverdue <= 30) return { bucket: '22-30 days', daysOverdue };
  if (daysOverdue <= 60) return { bucket: '31-60 days', daysOverdue };
  if (daysOverdue <= 90) return { bucket: '61-90 days', daysOverdue };
  return { bucket: '90+ days', daysOverdue };
}

export const getArrearsReport = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) {
        return { totalArrearsZMW: 0, studentCount: 0, byBucket: {}, students: [] };
      }

      const now = Date.now();

      const invoices = await ctx.db
        .query('invoices')
        .withIndex('by_school_term', (q) =>
          q.eq('schoolId', schoolId).eq('termId', args.termId),
        )
        .collect();

      // Filter to overdue/partial invoices with outstanding balance
      const overdueInvoices = invoices.filter(
        (inv) =>
          inv.status !== 'void' &&
          inv.status !== 'paid' &&
          inv.balanceZMW > 0 &&
          inv.dueDate < now,
      );

      const byBucket: Record<string, { count: number; totalZMW: number }> = {};
      let totalArrearsCents = 0;

      const students: Array<{
        studentId: string;
        studentName: string;
        invoiceNumber: string;
        invoiceId: string;
        balanceZMW: number;
        dueDate: number;
        daysOverdue: number;
        bucket: string;
      }> = [];

      for (const inv of overdueInvoices) {
        const { bucket, daysOverdue } = classifyArrears(inv.dueDate, now);
        const balanceCents = Math.round(inv.balanceZMW * 100);
        totalArrearsCents += balanceCents;

        if (!byBucket[bucket]) {
          byBucket[bucket] = { count: 0, totalZMW: 0 };
        }
        byBucket[bucket].count++;
        byBucket[bucket].totalZMW += balanceCents / 100;

        const student = await ctx.db.get(inv.studentId);

        students.push({
          studentId: inv.studentId as string,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown',
          invoiceNumber: inv.invoiceNumber,
          invoiceId: inv._id as string,
          balanceZMW: inv.balanceZMW,
          dueDate: inv.dueDate,
          daysOverdue,
          bucket,
        });
      }

      // Sort by days overdue descending
      students.sort((a, b) => b.daysOverdue - a.daysOverdue);

      return {
        totalArrearsZMW: totalArrearsCents / 100,
        studentCount: overdueInvoices.length,
        byBucket,
        students,
      };
    });
  },
});

// Reminder engine — runs as a scheduled cron job
export const processReminderEngine = internalMutation({
  args: {
    schoolId: v.id('schools'),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school || !school.isActive) return { processed: 0 };

    const arrearsPolicy = school.arrearsPolicy;
    if (!arrearsPolicy) return { processed: 0 };

    const reminderDays = arrearsPolicy.reminderScheduleDays;
    if (!reminderDays || reminderDays.length === 0) return { processed: 0 };

    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];
    let processed = 0;

    // Get all unpaid invoices
    const invoices = await ctx.db
      .query('invoices')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.neq(q.field('status'), 'void'),
          q.neq(q.field('status'), 'paid'),
          q.gt(q.field('balanceZMW'), 0),
        ),
      )
      .collect();

    for (const invoice of invoices) {
      if (!invoice.guardianId) continue;

      const daysUntilDue = Math.ceil(
        (invoice.dueDate - now) / (24 * 60 * 60 * 1000),
      );
      const daysOverdue = -daysUntilDue;

      // Check each reminder schedule day
      for (const day of reminderDays) {
        let reminderType: string;
        let shouldSend = false;

        if (day < 0) {
          // Pre-due reminder (e.g., -3 means 3 days before due)
          if (daysUntilDue === Math.abs(day)) {
            reminderType = `pre_due_${Math.abs(day)}d`;
            shouldSend = true;
          }
        } else if (day === 0) {
          // Due today
          if (daysUntilDue === 0) {
            reminderType = 'due_today';
            shouldSend = true;
          }
        } else {
          // Overdue reminder (e.g., 7 means 7 days overdue)
          if (daysOverdue === day) {
            reminderType = `overdue_${day}d`;
            shouldSend = true;
          }
        }

        if (!shouldSend) continue;

        // Check if reminder already sent today for this invoice + type
        const existingReminder = await ctx.db
          .query('reminderLog')
          .withIndex('by_invoice', (q) => q.eq('invoiceId', invoice._id))
          .filter((q) =>
            q.and(
              q.eq(q.field('reminderType'), reminderType!),
              q.gte(q.field('sentAt'), now - 24 * 60 * 60 * 1000),
            ),
          )
          .first();

        if (existingReminder) continue;

        // Log the reminder (actual SMS sending would be handled by notification system)
        await ctx.db.insert('reminderLog', {
          schoolId: args.schoolId,
          invoiceId: invoice._id,
          guardianId: invoice.guardianId,
          reminderType: reminderType!,
          channel: 'sms',
          sentAt: now,
        });

        // Update invoice status to overdue if past due
        if (daysOverdue > 0 && invoice.status === 'sent') {
          await ctx.db.patch(invoice._id, {
            status: 'overdue',
            updatedAt: now,
          });
        }

        processed++;
      }
    }

    return { processed };
  },
});
