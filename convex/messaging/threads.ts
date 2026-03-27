import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import {
  canSendMessages,
  getGuardianForUser,
  requireLinkedStudentAccess,
} from '../guardian/_helpers';

async function queueThreadRecipientNotifications(
  ctx: any,
  args: {
    schoolId: Id<'schools'>;
    threadId: Id<'messageThreads'>;
    messageId: Id<'messages'>;
    senderId: Id<'users'>;
    studentName?: string;
    messagePreview: string;
  },
) {
  const thread = await ctx.db.get(args.threadId);
  if (!thread) return;

  const now = Date.now();
  const recipients = thread.participantIds.filter((id: Id<'users'>) => id !== args.senderId);

  for (const recipientUserId of recipients) {
    const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
      schoolId: args.schoolId,
      recipientUserId,
      type: 'message',
      channel: 'in_app',
      subject: 'New message',
      body: args.studentName
        ? `New message about ${args.studentName}: ${args.messagePreview}`
        : `New message: ${args.messagePreview}`,
      link: `/messages/${thread._id}`,
      relatedEntityType: 'message_thread',
      relatedEntityId: thread._id,
    });

    await ctx.db.insert('messageNotifications', {
      schoolId: args.schoolId,
      userId: recipientUserId,
      threadId: thread._id,
      messageId: args.messageId,
      isRead: false,
      createdAt: now,
    });

    const user = await ctx.db.get(recipientUserId);
    if (!user?.phone || user.notifPrefs.sms !== true) {
      continue;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const priorSms = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q: any) => q.eq('userId', recipientUserId))
      .collect();

    const alreadySentToday = priorSms.some((item: any) =>
      item.channel === 'sms'
      && item.type === 'message'
      && item.relatedEntityType === 'message_thread'
      && item.relatedEntityId === thread._id
      && item.createdAt >= startOfDay.getTime(),
    );

    if (alreadySentToday) {
      continue;
    }

    const smsNotificationId = await ctx.runMutation(internal.notifications.createNotification, {
      schoolId: args.schoolId,
      recipientUserId,
      recipientPhone: user.phone,
      type: 'message',
      channel: 'sms',
      subject: 'New Acadowl message',
      body: args.studentName
        ? `You have a new message about ${args.studentName} on Acadowl. View: /messages/${thread._id}`
        : `You have a new message on Acadowl. View: /messages/${thread._id}`,
      link: `/messages/${thread._id}`,
      relatedEntityType: 'message_thread',
      relatedEntityId: thread._id,
    });

    await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
      to: user.phone,
      body: args.studentName
        ? `You have a new message about ${args.studentName} on Acadowl.`
        : 'You have a new message on Acadowl.',
      schoolId: args.schoolId,
      notificationId: smsNotificationId,
    });

    await ctx.runMutation(internal.notifications.updateDeliveryStatus, {
      notificationId,
      status: 'delivered',
    });
  }
}

export const getTeachersForStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Student was not found.');
      }

      requireLinkedStudentAccess(student, guardian._id);

      const [section, assignments] = await Promise.all([
        student.currentSectionId ? ctx.db.get(student.currentSectionId) : null,
        student.currentSectionId
          ? ctx.db
            .query('staffSubjectAssignments')
            .withIndex('by_section', (q) => q.eq('schoolId', scopedSchoolId).eq('sectionId', student.currentSectionId!))
            .collect()
          : Promise.resolve([]),
      ]);

      const teacherIds = new Set<Id<'staff'>>();
      if (section?.classTeacherId) {
        teacherIds.add(section.classTeacherId);
      }

      assignments.forEach((assignment) => {
        teacherIds.add(assignment.staffId);
      });

      const staff = await Promise.all(Array.from(teacherIds).map((id) => ctx.db.get(id)));
      const subjects = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const subjectMap = new Map(subjects.map((subject) => [subject._id, subject.name]));

      return staff
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .map((entry) => ({
          _id: entry._id,
          userId: entry.userId ?? null,
          name: `${entry.firstName} ${entry.lastName}`,
          photo: entry.avatarUrl ?? null,
          role: entry.role,
          subjects: assignments
            .filter((assignment) => assignment.staffId === entry._id)
            .map((assignment) => subjectMap.get(assignment.subjectId) ?? 'Subject'),
          isClassTeacher: section?.classTeacherId === entry._id,
        }));
    });
  },
});

export const startThreadWithTeacher = mutation({
  args: {
    studentId: v.id('students'),
    staffId: v.id('staff'),
    subject: v.string(),
    initialMessage: v.string(),
    context: v.optional(v.literal('general')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      const [student, staff] = await Promise.all([
        ctx.db.get(args.studentId),
        ctx.db.get(args.staffId),
      ]);

      if (!student || student.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Student was not found.');
      }

      if (!staff || staff.schoolId !== scopedSchoolId || !staff.userId) {
        throwError('NOT_FOUND', 'Teacher was not found.');
      }

      const link = requireLinkedStudentAccess(student, guardian._id);
      if (!canSendMessages(link)) {
        throwError('FORBIDDEN', 'This guardian link cannot initiate teacher messages.');
      }

      const existingThreads = await ctx.db
        .query('messageThreads')
        .withIndex('by_student', (q) => q.eq('studentId', student._id))
        .collect();

      const participants = [userId, staff.userId].sort();

      const existing = existingThreads.find((thread) =>
        thread.context === (args.context ?? 'general')
        && thread.participantIds.length === participants.length
        && thread.participantIds.every((participantId) => participants.includes(participantId)),
      );

      const now = Date.now();
      const preview = args.initialMessage.trim().slice(0, 80);

      let threadId = existing?._id;
      if (!threadId) {
        threadId = await ctx.db.insert('messageThreads', {
          schoolId: scopedSchoolId,
          context: args.context ?? 'general',
          studentId: student._id,
          participantIds: participants,
          subject: args.subject.trim(),
          lastMessageAt: now,
          lastMessagePreview: preview,
          isArchived: false,
          createdAt: now,
        });
      } else {
        await ctx.db.patch(threadId, {
          lastMessageAt: now,
          lastMessagePreview: preview,
        });
      }

      const messageId = await ctx.db.insert('messages', {
        schoolId: scopedSchoolId,
        threadId,
        senderId: userId,
        body: args.initialMessage.trim(),
        readBy: [{ userId, readAt: now }],
        isSystemMessage: false,
        createdAt: now,
      });

      await queueThreadRecipientNotifications(ctx, {
        schoolId: scopedSchoolId,
        threadId,
        messageId,
        senderId: userId,
        studentName: `${student.firstName} ${student.lastName}`,
        messagePreview: preview,
      });

      return { threadId, messageId };
    });
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.id('messageThreads'),
    body: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentType: v.optional(v.union(v.literal('image'), v.literal('pdf'), v.literal('document'))),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const thread = await ctx.db.get(args.threadId);

      if (!thread || thread.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Message thread was not found.');
      }

      if (!thread.participantIds.includes(userId)) {
        throwError('FORBIDDEN', 'You are not a participant in this thread.');
      }

      const now = Date.now();
      const body = args.body.trim();
      if (!body) {
        throwError('VALIDATION', 'Message body cannot be empty.');
      }

      const messageId = await ctx.db.insert('messages', {
        schoolId: scopedSchoolId,
        threadId: thread._id,
        senderId: userId,
        body,
        attachmentUrl: args.attachmentUrl,
        attachmentType: args.attachmentType,
        readBy: [{ userId, readAt: now }],
        isSystemMessage: false,
        createdAt: now,
      });

      await ctx.db.patch(thread._id, {
        lastMessageAt: now,
        lastMessagePreview: body.slice(0, 80),
      });

      await queueThreadRecipientNotifications(ctx, {
        schoolId: scopedSchoolId,
        threadId: thread._id,
        messageId,
        senderId: userId,
        messagePreview: body.slice(0, 80),
      });

      return { messageId };
    });
  },
});
