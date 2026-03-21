import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import {
  ensureBelongsToSchool,
  createSchoolAdminNotification,
} from '../schools/_helpers';
import {
  ensureGradeAndSection,
  formatStudentNumber,
  getStudentEnabledSchool,
  nextCounterValue,
  resolveGuardianLink,
} from './_helpers';

const guardianValidator = v.object({
  firstName: v.string(),
  lastName: v.string(),
  phone: v.string(),
  relationship: v.union(
    v.literal('parent'),
    v.literal('guardian'),
    v.literal('sibling'),
    v.literal('other'),
  ),
  email: v.optional(v.string()),
  address: v.optional(v.string()),
  preferredContactMethod: v.optional(v.union(v.literal('sms'), v.literal('whatsapp'), v.literal('email'))),
  isPrimary: v.boolean(),
});

export const enrollStudent = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.number(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    gradeId: v.id('grades'),
    sectionId: v.id('sections'), // Changed from optional to required
    enrollmentStatus: v.optional(
      v.union(v.literal('active'), v.literal('suspended'), v.literal('graduated'), v.literal('transferred'), v.literal('dropped_out')),
    ),
    eczCandidateNumber: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    medicalNotes: v.optional(v.string()),
    customFieldValues: v.optional(v.any()),
    guardians: v.array(guardianValidator),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { school, schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);

      if (args.guardians.length === 0) {
        throwError('VALIDATION', 'At least one guardian must be provided.');
      }

      if (!args.guardians.some((guardian) => guardian.isPrimary)) {
        throwError('VALIDATION', 'One guardian must be marked as the primary contact.');
      }

      const duplicateEmail = args.email
        ? await ctx.db
            .query('students')
            .withIndex('by_email', (q) => q.eq('schoolId', scopedSchoolId).eq('email', args.email))
            .unique()
        : null;

      if (duplicateEmail) {
        throwError('CONFLICT', 'A student with this email already exists.');
      }

      const duplicatePhone = args.phone
        ? await ctx.db
            .query('students')
            .withIndex('by_phone', (q) => q.eq('schoolId', scopedSchoolId).eq('phone', args.phone))
            .unique()
        : null;

      if (duplicatePhone) {
        throwError('CONFLICT', 'A student with this phone number already exists.');
      }

      const { section } = await ensureGradeAndSection(ctx, scopedSchoolId, args.gradeId, args.sectionId);

      if (!section) {
        throwError('VALIDATION', 'A section must be selected during enrolment.');
      }

      const sectionStudents = await ctx.db
        .query('students')
        .withIndex('by_section', (q) => q.eq('currentSectionId', section._id))
        .collect();

      if (sectionStudents.length >= section.maxStudents) {
        throwError('CONFLICT', 'Selected section is already at maximum capacity.');
      }

      const sequence = await nextCounterValue(ctx, scopedSchoolId, 'student_number');
      const studentNumber = formatStudentNumber(school, sequence);
      const guardianLinks = await Promise.all(
        args.guardians.map(async (guardian) => ({
          guardianId: await resolveGuardianLink(ctx, scopedSchoolId, guardian),
          relationship: guardian.relationship,
          isPrimary: guardian.isPrimary,
        })),
      );

      const now = Date.now();
      const studentId = await ctx.db.insert('students', {
        schoolId: scopedSchoolId,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        dateOfBirth: args.dateOfBirth,
        gender: args.gender,
        studentNumber,
        email: args.email?.trim().toLowerCase(),
        phone: args.phone?.trim(),
        currentGradeId: args.gradeId,
        currentSectionId: args.sectionId,
        eczCandidateNumber: args.eczCandidateNumber?.trim(),
        enrollmentStatus: args.enrollmentStatus ?? 'active',
        enrolledAt: now,
        guardianLinks,
        bloodType: args.bloodType?.trim(),
        allergies: args.allergies,
        medicalNotes: args.medicalNotes?.trim(),
        customFieldValues: args.customFieldValues,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert('sectionHistory', {
        schoolId: scopedSchoolId,
        studentId,
        gradeId: args.gradeId,
        sectionId: section._id,
        academicYearId: school.currentAcademicYearId,
        termId: school.currentTermId,
        reason: 'Initial enrolment',
        effectiveDate: now,
        createdBy: userId,
        createdAt: now,
      });

      await createSchoolAdminNotification(
        ctx,
        school,
        'Student enrolled',
        `${args.firstName.trim()} ${args.lastName.trim()} has been enrolled as ${studentNumber}.`,
        `/students/${studentId}`,
      );

      return { studentId, studentNumber };
    });
  },
});

export const updateStudentProfile = mutation({
  args: {
    studentId: v.id('students'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    medicalNotes: v.optional(v.string()),
    enrollmentStatus: v.optional(
      v.union(v.literal('active'), v.literal('suspended'), v.literal('graduated'), v.literal('transferred'), v.literal('dropped_out')),
    ),
    customFieldValues: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);
      const student = ensureBelongsToSchool(await ctx.db.get(args.studentId), scopedSchoolId, 'Student');

      await ctx.db.patch(student._id, {
        firstName: args.firstName?.trim() ?? student.firstName,
        lastName: args.lastName?.trim() ?? student.lastName,
        email: args.email?.trim().toLowerCase() ?? student.email,
        phone: args.phone?.trim() ?? student.phone,
        bloodType: args.bloodType?.trim() ?? student.bloodType,
        allergies: args.allergies ?? student.allergies,
        medicalNotes: args.medicalNotes?.trim() ?? student.medicalNotes,
        enrollmentStatus: args.enrollmentStatus ?? student.enrollmentStatus,
        customFieldValues: args.customFieldValues ?? student.customFieldValues,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const transferStudentSection = mutation({
  args: {
    studentId: v.id('students'),
    gradeId: v.id('grades'),
    sectionId: v.id('sections'),
    reason: v.optional(v.string()),
    effectiveDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { school, schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);
      const student = ensureBelongsToSchool(await ctx.db.get(args.studentId), scopedSchoolId, 'Student');
      const { section } = await ensureGradeAndSection(ctx, scopedSchoolId, args.gradeId, args.sectionId);

      if (!section) {
        throwError('VALIDATION', 'A destination section is required for transfer.');
      }

      const enrolledStudents = await ctx.db
        .query('students')
        .withIndex('by_section', (q) => q.eq('currentSectionId', section._id))
        .collect();

      const occupiedSlots = enrolledStudents.filter((entry) => entry._id !== student._id).length;
      if (occupiedSlots >= section.maxStudents) {
        throwError('CONFLICT', 'Destination section is full.');
      }

      const effectiveDate = args.effectiveDate ?? Date.now();

      await ctx.db.patch(student._id, {
        currentGradeId: args.gradeId,
        currentSectionId: args.sectionId,
        updatedAt: Date.now(),
      });

      await ctx.db.insert('sectionHistory', {
        schoolId: scopedSchoolId,
        studentId: student._id,
        gradeId: args.gradeId,
        sectionId: args.sectionId,
        academicYearId: school.currentAcademicYearId,
        termId: school.currentTermId,
        reason: args.reason?.trim() || 'Section transfer',
        effectiveDate,
        createdBy: userId,
        createdAt: Date.now(),
      });

      return { success: true };
    });
  },
});
