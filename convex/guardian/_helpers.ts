import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { throwError } from '../_lib/errors';

export type GuardianScopedCtx = MutationCtx | QueryCtx;

export type GuardianLink = {
  guardianId: Id<'guardians'>;
  relationship: string;
  isPrimary: boolean;
  canSeeResults?: boolean;
  canSeeAttendance?: boolean;
  canPayFees?: boolean;
  canSendMessages?: boolean;
  notificationOverrides?: {
    useGlobalPrefs: boolean;
    smsEnabled?: boolean;
    whatsappEnabled?: boolean;
    pushEnabled?: boolean;
    attendanceAbsent?: boolean;
    attendanceLate?: boolean;
    resultsReleased?: boolean;
    feeInvoiceGenerated?: boolean;
    feeReminder?: boolean;
    feePaymentConfirmed?: boolean;
    homeworkAssigned?: boolean;
    newMessage?: boolean;
    schoolAnnouncement?: boolean;
    weeklyDigest?: boolean;
  };
};

export async function getGuardianForUser(
  ctx: GuardianScopedCtx,
  schoolId: Id<'schools'>,
  userId: Id<'users'>,
): Promise<{ user: Doc<'users'>; guardian: Doc<'guardians'> }> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throwError('UNAUTHENTICATED', 'User profile was not found.');
  }

  if (!user.guardianId) {
    throwError('FORBIDDEN', 'Current account is not linked to a guardian profile.');
  }

  const guardian = await ctx.db.get(user.guardianId);
  if (!guardian || guardian.schoolId !== schoolId) {
    throwError('FORBIDDEN', 'Guardian profile is outside your school scope.');
  }

  return { user, guardian };
}

export async function getGuardianLinkedStudents(
  ctx: GuardianScopedCtx,
  schoolId: Id<'schools'>,
  guardianId: Id<'guardians'>,
): Promise<Array<Doc<'students'>>> {
  const students = await ctx.db
    .query('students')
    .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
    .collect();

  return students.filter((student) =>
    (student.guardianLinks ?? []).some((link) => link.guardianId === guardianId),
  );
}

export function getGuardianLinkForStudent(
  student: Doc<'students'>,
  guardianId: Id<'guardians'>,
): GuardianLink | null {
  const link = (student.guardianLinks ?? []).find((entry) => entry.guardianId === guardianId);
  return (link as GuardianLink | undefined) ?? null;
}

export function canSeeAttendance(link: GuardianLink | null): boolean {
  if (!link) return false;
  return link.canSeeAttendance !== false;
}

export function canSeeResults(link: GuardianLink | null): boolean {
  if (!link) return false;
  return link.canSeeResults !== false;
}

export function canPayFees(link: GuardianLink | null): boolean {
  if (!link) return false;
  return link.canPayFees !== false;
}

export function canSendMessages(link: GuardianLink | null): boolean {
  if (!link) return false;
  if (link.isPrimary) return true;
  return link.canSendMessages === true;
}

export function requireLinkedStudentAccess(
  student: Doc<'students'>,
  guardianId: Id<'guardians'>,
): GuardianLink {
  const link = getGuardianLinkForStudent(student, guardianId);

  if (!link) {
    throwError('FORBIDDEN', 'Guardian is not linked to this student.');
  }

  return link;
}
