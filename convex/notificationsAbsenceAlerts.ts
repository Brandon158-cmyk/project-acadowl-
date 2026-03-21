import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { throwError } from './_lib/errors';

function formatAlertDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-ZM', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => values[key] ?? '');
}

export const queueAttendanceStatusAlert = internalMutation({
  args: {
    schoolId: v.id('schools'),
    studentId: v.id('students'),
    date: v.string(),
    currentStatus: v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused')),
    previousStatus: v.optional(v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused'))),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    const student = await ctx.db.get(args.studentId);

    if (!school || !student || student.schoolId !== args.schoolId) {
      throwError('NOT_FOUND', 'Unable to queue attendance SMS alerts for this learner.');
    }

    const guardians = await Promise.all(
      (student.guardianLinks ?? []).map(async (link) => {
        const guardian = await ctx.db.get(link.guardianId);
        return guardian && guardian.schoolId === args.schoolId
          ? { guardian, isPrimary: link.isPrimary, relationship: link.relationship }
          : null;
      }),
    );

    const eligibleGuardians = guardians
      .filter((entry) => entry?.guardian.isActive)
      .filter((entry) => {
        const preferredContactMethod = entry?.guardian.preferredContactMethod;
        return !preferredContactMethod || preferredContactMethod === 'sms';
      })
      .map((entry) => entry!.guardian)
      .filter((guardian, index, collection) => collection.findIndex((entry) => entry.phone === guardian.phone) === index);

    if (eligibleGuardians.length === 0) {
      return { queued: 0, skipped: true };
    }

    const isAbsenceAlert = args.currentStatus === 'absent' && args.previousStatus !== 'absent';
    const isCorrectionAlert = args.currentStatus !== 'absent' && args.previousStatus === 'absent';

    if (!isAbsenceAlert && !isCorrectionAlert) {
      return { queued: 0, skipped: true };
    }

    const schoolName = school.name;
    const schoolPhone = school.phone?.trim() || 'the school office';
    const formattedDate = formatAlertDate(args.date);
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const template = isAbsenceAlert
      ? school.smsTemplates?.absenceAlert
      : 'Update: {{studentName}} is now showing as PRESENT on {{date}}. If you have questions, contact {{schoolName}} on {{schoolPhone}}.';

    let queued = 0;

    for (const guardian of eligibleGuardians) {
      const guardianName = `${guardian.firstName} ${guardian.lastName}`.trim();
      const body = renderTemplate(
        template ?? 'Dear {{guardianName}}, your child {{studentName}} was marked ABSENT on {{date}}. If this is an error, contact {{schoolName}} on {{schoolPhone}}.',
        {
          guardianName,
          studentName,
          date: formattedDate,
          schoolName,
          schoolPhone,
        },
      );

      const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
        schoolId: args.schoolId,
        recipientUserId: guardian.userId,
        recipientPhone: guardian.phone,
        type: 'attendance',
        channel: 'sms',
        subject: isAbsenceAlert ? 'Attendance alert' : 'Attendance correction',
        body,
        relatedEntityType: 'attendance',
        relatedEntityId: `${args.studentId}:${args.date}`,
        status: 'queued',
      });

      await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
        to: guardian.phone,
        body,
        schoolId: args.schoolId,
        notificationId,
      });

      queued += 1;
    }

    return { queued, skipped: false };
  },
});
