import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureBelongsToSchool, ensureSchoolId } from './_helpers';

export const assignStaffToSubjectSection = mutation({
  args: {
    staffId: v.id('staff'),
    subjectId: v.id('subjects'),
    sectionId: v.id('sections'),
    academicYearId: v.optional(v.id('academicYears')),
    isPrimaryTeacher: v.boolean(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [staff, subject, section] = await Promise.all([
        ctx.db.get(args.staffId),
        ctx.db.get(args.subjectId),
        ctx.db.get(args.sectionId),
      ]);

      ensureBelongsToSchool(staff, scopedSchoolId, 'Staff record');
      const ensuredSubject = ensureBelongsToSchool(subject, scopedSchoolId, 'Subject');
      const ensuredSection = ensureBelongsToSchool(section, scopedSchoolId, 'Section');

      const duplicate = (await ctx.db
        .query('staffSubjectAssignments')
        .withIndex('by_staff', (q) => q.eq('schoolId', scopedSchoolId).eq('staffId', args.staffId))
        .collect()).find(
        (assignment) =>
          assignment.subjectId === args.subjectId &&
          assignment.sectionId === args.sectionId &&
          assignment.academicYearId === args.academicYearId,
      );

      if (duplicate) {
        throwError('CONFLICT', 'This teacher is already assigned to the selected subject and section.');
      }

      if (ensuredSubject.gradeIds && !ensuredSubject.gradeIds.includes(ensuredSection.gradeId)) {
        throwError('VALIDATION', 'The selected subject is not assigned to the section grade.');
      }

      const now = Date.now();
      return ctx.db.insert('staffSubjectAssignments', {
        schoolId: scopedSchoolId,
        staffId: args.staffId,
        subjectId: args.subjectId,
        gradeId: ensuredSection.gradeId,
        sectionId: args.sectionId,
        academicYearId: args.academicYearId,
        isPrimaryTeacher: args.isPrimaryTeacher,
        createdAt: now,
        updatedAt: now,
      });
    });
  },
});

export const removeStaffAssignment = mutation({
  args: {
    assignmentId: v.id('staffSubjectAssignments'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const assignment = ensureBelongsToSchool(await ctx.db.get(args.assignmentId), scopedSchoolId, 'Assignment');
      await ctx.db.delete(assignment._id);
      return { success: true };
    });
  },
});

export const getAssignmentsForStaff = query({
  args: {
    staffId: v.id('staff'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.VIEW_CLASS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      ensureBelongsToSchool(await ctx.db.get(args.staffId), scopedSchoolId, 'Staff record');

      const [assignments, subjects, sections, grades, years] = await Promise.all([
        ctx.db.query('staffSubjectAssignments').withIndex('by_staff', (q) => q.eq('schoolId', scopedSchoolId).eq('staffId', args.staffId)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('academicYears').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return assignments.map((assignment) => ({
        ...assignment,
        subject: subjects.find((subject) => subject._id === assignment.subjectId) ?? null,
        section: sections.find((section) => section._id === assignment.sectionId) ?? null,
        grade: grades.find((grade) => grade._id === assignment.gradeId) ?? null,
        academicYear: years.find((year) => year._id === assignment.academicYearId) ?? null,
      }));
    });
  },
});

export const getAssignmentsForSection = query({
  args: {
    sectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.VIEW_CLASS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const section = ensureBelongsToSchool(await ctx.db.get(args.sectionId), scopedSchoolId, 'Section');
      const [assignments, staff, subjects] = await Promise.all([
        ctx.db.query('staffSubjectAssignments').withIndex('by_section', (q) => q.eq('schoolId', scopedSchoolId).eq('sectionId', args.sectionId)).collect(),
        ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return {
        section,
        assignments: assignments.map((assignment) => ({
          ...assignment,
          staff: staff.find((entry) => entry._id === assignment.staffId) ?? null,
          subject: subjects.find((subject) => subject._id === assignment.subjectId) ?? null,
        })),
      };
    });
  },
});

export const getAssignmentFormData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [staff, subjects, sections, currentAcademicYear] = await Promise.all([
        ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('academicYears').withIndex('by_current', (q) => q.eq('schoolId', scopedSchoolId).eq('isCurrent', true)).unique(),
      ]);

      return {
        staff: staff.filter((entry) => entry.staffCategory !== 'non_teaching' && entry.isActive).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
        subjects: subjects.filter((subject) => subject.isActive).sort((a, b) => a.name.localeCompare(b.name)),
        sections: sections.filter((section) => section.isActive).sort((a, b) => a.name.localeCompare(b.name)),
        currentAcademicYear,
      };
    });
  },
});
