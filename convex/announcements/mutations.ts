import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { api, internal } from '../_generated/api';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from '../schools/_helpers';

const announcementCategory = v.union(
  v.literal('general'),
  v.literal('academic'),
  v.literal('events'),
  v.literal('fees'),
  v.literal('holidays'),
  v.literal('hostel'),
  v.literal('transport'),
  v.literal('emergency'),
);

const targetAudience = v.union(
  v.literal('all'),
  v.literal('parents_only'),
  v.literal('students_only'),
  v.literal('staff_only'),
  v.literal('boarding_parents'),
);

async function getAudienceUsers(
  ctx: any,
  schoolId: string,
  audience: 'all' | 'parents_only' | 'students_only' | 'staff_only' | 'boarding_parents',
  targetGradeIds?: string[],
) {
  const users = await ctx.db
    .query('users')
    .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
    .collect();

  if (audience === 'all') return users;

  if (audience === 'parents_only') {
    const guardians = await ctx.db
      .query('guardians')
      .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
      .collect();

    const guardianByUserId = new Set(
      guardians
        .filter((guardian: any) => !targetGradeIds || targetGradeIds.length === 0 || guardiansHasGrade(ctx, schoolId, guardian._id, targetGradeIds))
        .map((guardian: any) => guardian.userId)
        .filter(Boolean),
    );

    return users.filter((user: any) => guardianByUserId.has(user._id));
  }

  if (audience === 'students_only') {
    return users.filter((user: any) => user.role === 'student');
  }

  if (audience === 'staff_only') {
    return users.filter((user: any) =>
      ['school_admin', 'deputy_head', 'bursar', 'teacher', 'class_teacher', 'matron', 'librarian', 'driver'].includes(user.role),
    );
  }

  if (audience === 'boarding_parents') {
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
      .collect();

    const boardingGuardianIds = new Set(
      students
        .filter((student: any) => student.boardingStatus === 'boarder' || student.boardingStatus === 'boarding')
        .flatMap((student: any) => (student.guardianLinks ?? []).map((link: any) => link.guardianId)),
    );

    const guardians = await ctx.db
      .query('guardians')
      .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
      .collect();

    const userIds = guardians
      .filter((guardian: any) => boardingGuardianIds.has(guardian._id))
      .map((guardian: any) => guardian.userId)
      .filter(Boolean);

    const idSet = new Set(userIds);
    return users.filter((user: any) => idSet.has(user._id));
  }

  return [];
}

function guardiansHasGrade(
  _ctx: any,
  _schoolId: string,
  _guardianId: string,
  _targetGradeIds: string[],
) {
  return true;
}

export const listAnnouncements = query({
  args: {
    includeDrafts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const records = await ctx.db
        .query('announcements')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return records
        .filter((record) => (args.includeDrafts ? true : record.isPublished))
        .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
    });
  },
});

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    category: announcementCategory,
    targetAudience,
    targetGradeIds: v.optional(v.array(v.id('grades'))),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    sendSMS: v.boolean(),
    sendWhatsApp: v.boolean(),
    isPinned: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const announcementId = await ctx.db.insert('announcements', {
        schoolId: scopedSchoolId,
        title: args.title.trim(),
        body: args.body.trim(),
        category: args.category,
        targetAudience: args.targetAudience,
        targetGradeIds: args.targetGradeIds,
        attachmentUrl: args.attachmentUrl,
        attachmentName: args.attachmentName,
        sendSMS: args.sendSMS,
        sendWhatsApp: args.sendWhatsApp,
        isPublished: false,
        publishedAt: undefined,
        expiresAt: args.expiresAt,
        isPinned: args.isPinned ?? false,
        createdBy: userId,
        createdAt: Date.now(),
      });

      return { announcementId };
    });
  },
});

export const publishAnnouncement = mutation({
  args: {
    announcementId: v.id('announcements'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const announcement = await ctx.db.get(args.announcementId);

      if (!announcement || announcement.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Announcement was not found.');
      }

      const now = Date.now();
      await ctx.db.patch(announcement._id, {
        isPublished: true,
        publishedAt: now,
      });

      const recipients = await getAudienceUsers(
        ctx,
        scopedSchoolId,
        announcement.targetAudience,
        announcement.targetGradeIds,
      );

      for (const recipient of recipients) {
        await ctx.runMutation(internal.notifications.createNotification, {
          schoolId: scopedSchoolId,
          recipientUserId: recipient._id,
          recipientPhone: recipient.phone,
          type: announcement.category === 'emergency' ? 'emergency' : 'announcement',
          channel: 'in_app',
          subject: announcement.title,
          body: announcement.body,
          relatedEntityType: 'announcement',
          relatedEntityId: announcement._id,
          link: '/announcements',
        });
      }

      if (announcement.sendSMS || announcement.category === 'emergency') {
        await ctx.runMutation(api.notificationsBroadcast.sendBroadcastSms, {
          target: 'all_guardians',
          message: `${announcement.title}: ${announcement.body}`.slice(0, 480),
        });
      }

      if (announcement.sendWhatsApp) {
        for (const recipient of recipients) {
          if (!recipient.phone) continue;

          await ctx.scheduler.runAfter(0, internal.notificationsWhatsapp.sendWhatsAppMessage, {
            schoolId: scopedSchoolId,
            to: recipient.phone,
            templateName: 'generalAnnouncement',
            body: `${announcement.title}: ${announcement.body}`,
            relatedEntityType: 'announcement',
            relatedEntityId: announcement._id,
            triggeredByUserId: userId,
          });
        }
      }

      return {
        success: true,
        recipientCount: recipients.length,
      };
    });
  },
});

export const unpublishAnnouncement = mutation({
  args: {
    announcementId: v.id('announcements'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.SEND_BULK_SMS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const announcement = await ctx.db.get(args.announcementId);

      if (!announcement || announcement.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Announcement was not found.');
      }

      await ctx.db.patch(announcement._id, {
        isPublished: false,
      });

      return { success: true };
    });
  },
});
