import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { throwError } from '../_lib/errors';

export type SchoolScopedCtx = MutationCtx | QueryCtx;

export function ensureSchoolId(schoolId: Id<'schools'> | null): Id<'schools'> {
  if (!schoolId) {
    throwError('FORBIDDEN', 'No school context is available for this request.');
  }

  return schoolId;
}

export async function getSchoolOrThrow(ctx: SchoolScopedCtx, schoolId: Id<'schools'>) {
  const school = await ctx.db.get(schoolId);

  if (!school) {
    throwError('NOT_FOUND', 'The school record could not be found.');
  }

  return school;
}

export function parseDateString(value: string, fieldLabel: string): number {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throwError('VALIDATION', `${fieldLabel} must be a valid date.`);
  }

  return timestamp;
}

export function ensureDateRange(startDate: number, endDate: number, label: string) {
  if (endDate <= startDate) {
    throwError('VALIDATION', `${label} end date must be later than the start date.`);
  }
}

export function ensureBelongsToSchool<T extends { schoolId: Id<'schools'> }>(
  document: T | null,
  schoolId: Id<'schools'>,
  label: string,
): T {
  if (!document) {
    throwError('NOT_FOUND', `${label} was not found.`);
  }

  if (document.schoolId !== schoolId) {
    throwError('FORBIDDEN', `${label} does not belong to your school.`);
  }

  return document;
}

export async function createSchoolAdminNotification(
  ctx: MutationCtx,
  school: Doc<'schools'>,
  title: string,
  body: string,
  link?: string,
) {
  const admins = await ctx.db
    .query('users')
    .withIndex('by_school', (q) => q.eq('schoolId', school._id))
    .collect();

  const recipients = admins.filter((user) =>
    user.role === 'school_admin' || user.role === 'deputy_head',
  );

  await Promise.all(
    recipients.map((user) =>
      ctx.db.insert('notifications', {
        schoolId: school._id,
        userId: user._id,
        type: 'general',
        title,
        body,
        link,
        isRead: false,
        createdAt: Date.now(),
      }),
    ),
  );
}

export function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

interface DefaultGradeDefinition {
  name: string;
  level: number;
  graduationGrade?: boolean;
  isEczExamYear?: boolean;
  hasPracticalAssessment?: boolean;
}

export function getDefaultGradesForSchoolType(type: Doc<'schools'>['type']): DefaultGradeDefinition[] {
  switch (type) {
    case 'primary_day':
    case 'primary_boarding':
      return Array.from({ length: 7 }, (_, index) => ({
        name: `Grade ${index + 1}`,
        level: index + 1,
        graduationGrade: index + 1 === 7,
        isEczExamYear: index + 1 === 7,
      }));
    case 'secondary_day':
    case 'secondary_boarding':
    case 'mixed_secondary':
    case 'combined':
      return Array.from({ length: 5 }, (_, index) => {
        const level = index + 8;

        return {
          name: `Grade ${level}`,
          level,
          graduationGrade: level === 9 || level === 12,
          isEczExamYear: level === 9 || level === 12,
        };
      });
    case 'college':
      return Array.from({ length: 4 }, (_, index) => ({
        name: `Year ${index + 1}`,
        level: index + 1,
      }));
    default:
      return [];
  }
}

interface DefaultSubjectDefinition {
  name: string;
  code: string;
  category: Doc<'subjects'>['category'];
  isCompulsory: boolean;
  isStemSubject?: boolean;
  eczSubjectCode?: string;
}

export function getDefaultSubjectsForSchoolType(type: Doc<'schools'>['type']): DefaultSubjectDefinition[] {
  if (type === 'college') {
    return [];
  }

  if (type === 'primary_day' || type === 'primary_boarding') {
    return [
      { name: 'English', code: 'ENG', category: 'core', isCompulsory: true },
      { name: 'Mathematics', code: 'MATH', category: 'core', isCompulsory: true, isStemSubject: true },
      { name: 'Science', code: 'SCI', category: 'core', isCompulsory: true, isStemSubject: true },
      { name: 'Social Studies', code: 'SST', category: 'core', isCompulsory: true },
      { name: 'Creative Arts', code: 'ART', category: 'core', isCompulsory: true },
      { name: 'Physical Education', code: 'PE', category: 'core', isCompulsory: true },
      { name: 'Religious Education', code: 'RE', category: 'core', isCompulsory: true },
      { name: 'Zambian Languages', code: 'ZL', category: 'core', isCompulsory: true },
    ];
  }

  return [
    { name: 'English Language', code: 'ENG', category: 'core', isCompulsory: true, eczSubjectCode: 'ENG' },
    { name: 'Mathematics', code: 'MATH', category: 'core', isCompulsory: true, isStemSubject: true, eczSubjectCode: 'MTH' },
    { name: 'Integrated Science', code: 'ISCI', category: 'core', isCompulsory: true, isStemSubject: true },
    { name: 'Biology', code: 'BIO', category: 'elective', isCompulsory: false, isStemSubject: true },
    { name: 'Chemistry', code: 'CHEM', category: 'elective', isCompulsory: false, isStemSubject: true },
    { name: 'Physics', code: 'PHY', category: 'elective', isCompulsory: false, isStemSubject: true },
    { name: 'History', code: 'HIST', category: 'elective', isCompulsory: false },
    { name: 'Geography', code: 'GEO', category: 'elective', isCompulsory: false },
    { name: 'Civic Education', code: 'CIV', category: 'core', isCompulsory: true },
    { name: 'Religious Education', code: 'RE', category: 'elective', isCompulsory: false },
    { name: 'Home Economics', code: 'HE', category: 'elective', isCompulsory: false },
    { name: 'Commerce', code: 'COM', category: 'elective', isCompulsory: false },
    { name: 'Principles of Accounts', code: 'POA', category: 'elective', isCompulsory: false },
    { name: 'Computer Studies', code: 'CS', category: 'elective', isCompulsory: false, isStemSubject: true },
    { name: 'Physical Education', code: 'PE', category: 'elective', isCompulsory: false },
    { name: 'French', code: 'FR', category: 'elective', isCompulsory: false },
    { name: 'Fine Art', code: 'FA', category: 'elective', isCompulsory: false },
    { name: 'Music', code: 'MUS', category: 'elective', isCompulsory: false },
    { name: 'Design & Technology', code: 'DT', category: 'technical', isCompulsory: false, isStemSubject: true },
  ];
}
