import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { Permission, requirePermission } from './_lib/permissions';
import { withSchoolScope } from './_lib/schoolContext';
import { throwError } from './_lib/errors';
import { ensureSchoolId } from './schools/_helpers';
import { normalizeZambianPhoneNumber } from '../src/lib/constants/zambia';

const broadcastTargetValidator = v.union(
  v.literal('all_guardians'),
  v.literal('grade_guardians'),
  v.literal('section_guardians'),
  v.literal('all_staff'),
  v.literal('custom_numbers'),
);

async function getBroadcastContext(ctx: Parameters<typeof withSchoolScope>[0], schoolId: ReturnType<typeof ensureSchoolId>) {
  const [school, students, guardians, staff, grades, sections, notifications] = await Promise.all([
    ctx.db.get(schoolId),
    ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
    ctx.db.query('guardians').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
    ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
    ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
    ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
    ctx.db.query('notifications').withIndex('by_school', (q) => q.eq('schoolId', schoolId)).collect(),
  ]);

  if (!school) {
    throwError('NOT_FOUND', 'School was not found.');
  }

  return { school, students, guardians, staff, grades, sections, notifications };
}

function getRecipientPhones(args: {
  target: 'all_guardians' | 'grade_guardians' | 'section_guardians' | 'all_staff' | 'custom_numbers';
  gradeId?: string;
  sectionId?: string;
  customNumbers?: string[];
  students: Array<{ currentGradeId?: string; currentSectionId?: string; guardianLinks?: Array<{ guardianId: string }> }>;
  guardians: Array<{ _id: string; phone: string; isActive: boolean; preferredContactMethod?: 'sms' | 'whatsapp' | 'email' }>;
  staff: Array<{ phone?: string; isActive: boolean }>;
}) {
  if (args.target === 'custom_numbers') {
    return Array.from(new Set((args.customNumbers ?? []).map((value) => normalizeZambianPhoneNumber(value)).filter(Boolean)));
  }

  if (args.target === 'all_staff') {
    return Array.from(new Set(args.staff.filter((entry) => entry.isActive && entry.phone).map((entry) => normalizeZambianPhoneNumber(entry.phone!))));
  }

  const matchingStudents = args.students.filter((student) => {
    if (args.target === 'grade_guardians') {
      return student.currentGradeId === args.gradeId;
    }

    if (args.target === 'section_guardians') {
      return student.currentSectionId === args.sectionId;
    }

    return true;
  });

  const guardianIds = matchingStudents.flatMap((student) => (student.guardianLinks ?? []).map((link) => link.guardianId));

  return Array.from(
    new Set(
      args.guardians
        .filter((guardian) => guardian.isActive)
        .filter((guardian) => guardianIds.includes(guardian._id))
        .filter((guardian) => !guardian.preferredContactMethod || guardian.preferredContactMethod === 'sms')
        .map((guardian) => normalizeZambianPhoneNumber(guardian.phone)),
    ),
  );
}

export const getBroadcastComposerData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { school, grades, sections, notifications } = await getBroadcastContext(ctx, scopedSchoolId);

      return {
        smsBalance: school.smsBalance ?? 0,
        grades: grades.sort((a, b) => a.level - b.level),
        sections: sections.sort((a, b) => a.name.localeCompare(b.name)),
        sentHistory: notifications
          .filter((notification) => notification.channel === 'sms' && notification.relatedEntityType === 'broadcast')
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20),
      };
    });
  },
});

export const previewBroadcastRecipients = query({
  args: {
    target: broadcastTargetValidator,
    gradeId: v.optional(v.id('grades')),
    sectionId: v.optional(v.id('sections')),
    customNumbers: v.optional(v.array(v.string())),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { school, students, guardians, staff } = await getBroadcastContext(ctx, scopedSchoolId);
      const phones = getRecipientPhones({
        target: args.target,
        gradeId: args.gradeId,
        sectionId: args.sectionId,
        customNumbers: args.customNumbers,
        students,
        guardians,
        staff,
      });
      const estimatedUnits = phones.length * Math.max(1, Math.ceil(args.message.trim().length / 160));

      return {
        recipientCount: phones.length,
        estimatedUnits,
        smsBalance: school.smsBalance ?? 0,
        hasSufficientBalance: (school.smsBalance ?? 0) >= estimatedUnits,
      };
    });
  },
});

export const sendBroadcastSms = mutation({
  args: {
    target: broadcastTargetValidator,
    gradeId: v.optional(v.id('grades')),
    sectionId: v.optional(v.id('sections')),
    customNumbers: v.optional(v.array(v.string())),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { school, students, guardians, staff } = await getBroadcastContext(ctx, scopedSchoolId);
      const message = args.message.trim();

      if (!message) {
        throwError('VALIDATION', 'A broadcast message is required.');
      }

      const phones = getRecipientPhones({
        target: args.target,
        gradeId: args.gradeId,
        sectionId: args.sectionId,
        customNumbers: args.customNumbers,
        students,
        guardians,
        staff,
      });

      const estimatedUnits = phones.length * Math.max(1, Math.ceil(message.length / 160));
      const currentBalance = school.smsBalance ?? 0;

      if (phones.length === 0) {
        throwError('VALIDATION', 'No SMS recipients matched the selected audience.');
      }

      if (currentBalance < estimatedUnits) {
        throwError('SMS_BALANCE_LOW', 'SMS balance is too low for this broadcast.');
      }

      const batchId = `broadcast-${Date.now()}-${userId}`;

      for (const phone of phones) {
        const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
          schoolId: scopedSchoolId,
          recipientPhone: phone,
          type: 'general',
          channel: 'sms',
          subject: 'School broadcast',
          body: message,
          relatedEntityType: 'broadcast',
          relatedEntityId: batchId,
          status: 'queued',
        });

        await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
          to: phone,
          body: message,
          schoolId: scopedSchoolId,
          notificationId,
        });
      }

      await ctx.db.patch(school._id, {
        smsBalance: currentBalance - estimatedUnits,
      });

      return {
        recipientCount: phones.length,
        estimatedCost: estimatedUnits,
        notificationBatchId: batchId,
      };
    });
  },
});
