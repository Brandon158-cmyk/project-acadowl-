import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { requireFeature } from '../_lib/featureGuard';
import { throwError } from '../_lib/errors';
import { ensureBelongsToSchool, ensureSchoolId, getSchoolOrThrow } from '../schools/_helpers';

export type StudentScopedCtx = MutationCtx | QueryCtx;

export async function getStudentEnabledSchool(
  ctx: StudentScopedCtx,
  schoolId: Id<'schools'> | null,
) {
  const scopedSchoolId = ensureSchoolId(schoolId);
  const school = await getSchoolOrThrow(ctx, scopedSchoolId);
  requireFeature(school, 'STUDENTS');
  return { school, schoolId: scopedSchoolId };
}

export async function nextCounterValue(
  ctx: MutationCtx,
  schoolId: Id<'schools'>,
  key: string,
) {
  const existing = await ctx.db
    .query('counters')
    .withIndex('by_school_key', (q) => q.eq('schoolId', schoolId).eq('key', key))
    .unique();

  const nextValue = (existing?.value ?? 0) + 1;

  if (existing) {
    await ctx.db.patch(existing._id, {
      value: nextValue,
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert('counters', {
      schoolId,
      key,
      value: nextValue,
      updatedAt: Date.now(),
    });
  }

  return nextValue;
}

export function formatStudentNumber(school: Doc<'schools'>, sequence: number) {
  const prefixSource = school.shortName?.trim() || school.slug || school.name;
  const normalizedPrefix = prefixSource
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'X');
  const year = new Date().getFullYear();

  return `${normalizedPrefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

export interface GuardianInput {
  firstName: string;
  lastName: string;
  phone: string;
  relationship: 'parent' | 'guardian' | 'sibling' | 'other';
  email?: string;
  address?: string;
  preferredContactMethod?: 'sms' | 'whatsapp' | 'email';
  isPrimary: boolean;
}

export async function resolveGuardianLink(
  ctx: MutationCtx,
  schoolId: Id<'schools'>,
  guardian: GuardianInput,
) {
  const trimmedPhone = guardian.phone.trim();
  const trimmedEmail = guardian.email?.trim().toLowerCase();

  const existingByPhone = await ctx.db
    .query('guardians')
    .withIndex('by_phone', (q) => q.eq('schoolId', schoolId).eq('phone', trimmedPhone))
    .unique();

  let resolvedGuardian = existingByPhone;

  if (!resolvedGuardian && trimmedEmail) {
    const guardians = await ctx.db
      .query('guardians')
      .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
      .collect();

    resolvedGuardian = guardians.find((entry) => entry.email?.toLowerCase() === trimmedEmail) ?? null;
  }

  if (resolvedGuardian) {
    await ctx.db.patch(resolvedGuardian._id, {
      firstName: guardian.firstName.trim(),
      lastName: guardian.lastName.trim(),
      email: trimmedEmail,
      address: guardian.address?.trim(),
      relationship: guardian.relationship,
      preferredContactMethod: guardian.preferredContactMethod,
      updatedAt: Date.now(),
    });

    return resolvedGuardian._id;
  }

  const guardianId = await ctx.db.insert('guardians', {
    schoolId,
    firstName: guardian.firstName.trim(),
    lastName: guardian.lastName.trim(),
    email: trimmedEmail,
    phone: trimmedPhone,
    relationship: guardian.relationship,
    address: guardian.address?.trim(),
    preferredContactMethod: guardian.preferredContactMethod,
    isVerified: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const matchingUsers = await ctx.db
    .query('users')
    .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
    .collect();

  const linkedUser = matchingUsers.find(
    (user) => user.phone === trimmedPhone || (trimmedEmail ? user.email?.toLowerCase() === trimmedEmail : false),
  );

  if (linkedUser) {
    await ctx.db.patch(linkedUser._id, {
      guardianId,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(guardianId, {
      userId: linkedUser._id,
      updatedAt: Date.now(),
    });
  }

  return guardianId;
}

export async function ensureGradeAndSection(
  ctx: StudentScopedCtx,
  schoolId: Id<'schools'>,
  gradeId: Id<'grades'>,
  sectionId?: Id<'sections'>,
) {
  const grade = ensureBelongsToSchool(await ctx.db.get(gradeId), schoolId, 'Grade');

  if (!sectionId) {
    return { grade, section: null };
  }

  const section = ensureBelongsToSchool(await ctx.db.get(sectionId), schoolId, 'Section');
  if (section.gradeId !== grade._id) {
    throwError('VALIDATION', 'Selected section does not belong to the selected grade.');
  }

  return { grade, section };
}
