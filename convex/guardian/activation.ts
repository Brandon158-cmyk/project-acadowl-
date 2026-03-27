import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { internalMutation, mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureBelongsToSchool, ensureSchoolId } from '../schools/_helpers';

function generateActivationToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function queueInvitation(
  ctx: any,
  args: {
    schoolId: any;
    guardianId: any;
    studentId: any;
    status?: 'sent' | 'resent';
  },
) {
  const [guardian, student, school] = await Promise.all([
    ctx.db.get(args.guardianId),
    ctx.db.get(args.studentId),
    ctx.db.get(args.schoolId),
  ]);

  const scopedGuardian = ensureBelongsToSchool(guardian, args.schoolId, 'Guardian');
  const scopedStudent = ensureBelongsToSchool(student, args.schoolId, 'Student');

  if (!school) {
    throwError('NOT_FOUND', 'School was not found.');
  }

  const now = Date.now();
  const token = generateActivationToken();
  const expiresAt = now + (72 * 60 * 60 * 1000);
  const invitationId = await ctx.db.insert('guardianInvitations', {
    schoolId: args.schoolId,
    guardianId: scopedGuardian._id,
    studentId: scopedStudent._id,
    token,
    sentTo: scopedGuardian.phone,
    status: args.status ?? 'sent',
    sentAt: now,
    expiresAt,
  });

  const body = `${school.name} has registered you as guardian for ${scopedStudent.firstName} ${scopedStudent.lastName}. Access your parent portal: /activate?token=${token}. Your login is your phone number.`;

  const notificationId = await ctx.runMutation(internal.notifications.createNotification, {
    schoolId: args.schoolId,
    recipientUserId: scopedGuardian.userId,
    recipientPhone: scopedGuardian.phone,
    type: 'general',
    channel: 'sms',
    subject: `${school.shortName ?? school.name} guardian invitation`,
    body,
    relatedEntityType: 'guardian_invitation',
    relatedEntityId: invitationId,
  });

  await ctx.scheduler.runAfter(0, internal.notificationsSms.sendSms, {
    to: scopedGuardian.phone,
    body,
    schoolId: args.schoolId,
    notificationId,
  });

  return { invitationId, expiresAt };
}

export const queueGuardianInvitation = internalMutation({
  args: {
    schoolId: v.id('schools'),
    guardianId: v.id('guardians'),
    studentId: v.id('students'),
    status: v.optional(v.union(v.literal('sent'), v.literal('resent'))),
  },
  handler: async (ctx, args) => {
    return queueInvitation(ctx, args);
  },
});

export const validateActivationToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query('guardianInvitations')
      .withIndex('by_token', (q) => q.eq('token', args.token.trim()))
      .unique();

    if (!invitation) {
      return { valid: false as const, reason: 'not_found' as const };
    }

    if (invitation.status === 'accepted') {
      return { valid: false as const, reason: 'already_used' as const };
    }

    if (invitation.expiresAt < Date.now()) {
      return { valid: false as const, reason: 'expired' as const };
    }

    const [guardian, student, school] = await Promise.all([
      ctx.db.get(invitation.guardianId),
      ctx.db.get(invitation.studentId),
      ctx.db.get(invitation.schoolId),
    ]);

    if (!guardian || !student || !school) {
      return { valid: false as const, reason: 'invalid_context' as const };
    }

    return {
      valid: true as const,
      invitationId: invitation._id,
      guardianId: guardian._id,
      studentId: student._id,
      schoolId: school._id,
      schoolName: school.name,
      schoolSlug: school.slug,
      studentName: `${student.firstName} ${student.lastName}`,
      guardianName: `${guardian.firstName} ${guardian.lastName}`,
      sentTo: invitation.sentTo,
      expiresAt: invitation.expiresAt,
    };
  },
});

export const sendGuardianInvitation = mutation({
  args: {
    guardianId: v.id('guardians'),
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      return queueInvitation(ctx, {
        schoolId: scopedSchoolId,
        guardianId: args.guardianId,
        studentId: args.studentId,
        status: 'sent',
      });
    });
  },
});

export const resendInvitation = mutation({
  args: {
    invitationId: v.id('guardianInvitations'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const invitation = ensureBelongsToSchool(
        await ctx.db.get(args.invitationId),
        scopedSchoolId,
        'Guardian invitation',
      );

      await ctx.db.patch(invitation._id, {
        status: 'resent',
      });

      return queueInvitation(ctx, {
        schoolId: invitation.schoolId,
        guardianId: invitation.guardianId,
        studentId: invitation.studentId,
        status: 'sent',
      });
    });
  },
});

export const activateGuardianAccount = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query('guardianInvitations')
      .withIndex('by_token', (q) => q.eq('token', args.token.trim()))
      .unique();

    if (!invitation) {
      throwError('NOT_FOUND', 'Activation link is invalid.');
    }

    if (invitation.status === 'accepted') {
      throwError('CONFLICT', 'Activation link has already been used.');
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: 'expired' });
      throwError('VALIDATION', 'Activation link has expired.');
    }

    const [guardian, school] = await Promise.all([
      ctx.db.get(invitation.guardianId),
      ctx.db.get(invitation.schoolId),
    ]);

    if (!guardian || !school) {
      throwError('NOT_FOUND', 'Guardian activation context is incomplete.');
    }

    const now = Date.now();
    await ctx.db.patch(invitation._id, {
      status: 'accepted',
      acceptedAt: now,
    });

    await ctx.db.patch(guardian._id, {
      isVerified: true,
      updatedAt: now,
    });

    if (guardian.userId) {
      await ctx.db.patch(guardian.userId, {
        isFirstLogin: true,
        updatedAt: now,
      });
    }

    return {
      schoolSlug: school.slug,
      guardianId: guardian._id,
    };
  },
});
