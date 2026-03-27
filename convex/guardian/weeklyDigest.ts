import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

function truncateSmsBody(input: string): string {
  if (input.length <= 160) {
    return input;
  }
  return `${input.slice(0, 157)}...`;
}

export const sendWeeklyDigestSMS = internalAction({
  args: {
    schoolId: v.id('schools'),
    snapshotIds: v.array(v.id('studentProgressSnapshots')),
  },
  handler: async (ctx, args) => {
    const school = await ctx.runQuery(internal.analytics.getSchoolByIdInternal, {
      schoolId: args.schoolId,
    });

    if (!school || school.sendWeeklyDigest === false) {
      return { sent: 0, skipped: args.snapshotIds.length };
    }

    let sent = 0;
    let skipped = 0;

    for (const snapshotId of args.snapshotIds) {
      const snapshot = await ctx.runQuery(internal.analytics.getSnapshotByIdInternal, {
        snapshotId,
      });

      if (!snapshot) {
        skipped += 1;
        continue;
      }

      const student = await ctx.runQuery(internal.analytics.getStudentByIdInternal, {
        studentId: snapshot.studentId,
      });

      if (!student) {
        skipped += 1;
        continue;
      }

      const links = student.guardianLinks ?? [];
      for (const link of links) {
        const guardian = await ctx.runQuery(internal.analytics.getGuardianByIdInternal, {
          guardianId: link.guardianId,
        });

        if (!guardian || guardian.receiveWeeklyDigest === false || !guardian.phone) {
          continue;
        }

        const body = truncateSmsBody(
          `Week ${snapshot.weekNumber} update for ${student.firstName} ${student.lastName} at ${school.shortName ?? school.name}. Attendance: ${Math.round(snapshot.attendancePercentThisWeek)}%. Fees owing: ZMW ${snapshot.feeBalanceZMW}.`,
        );

        const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
          schoolId: args.schoolId,
          recipientUserId: guardian.userId,
          recipientPhone: guardian.phone,
          type: 'general',
          channel: 'sms',
          subject: 'Weekly digest',
          body,
          relatedEntityType: 'student_progress_snapshot',
          relatedEntityId: snapshot._id,
        });

        await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
          to: guardian.phone,
          body,
          schoolId: args.schoolId,
          notificationId,
        });

        sent += 1;
      }
    }

    return { sent, skipped };
  },
});
