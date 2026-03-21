import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureBelongsToSchool, ensureSchoolId } from './_helpers';

export const createSection = mutation({
  args: {
    gradeId: v.id('grades'),
    academicYearId: v.optional(v.id('academicYears')),
    name: v.string(),
    displayName: v.optional(v.string()),
    classTeacherId: v.optional(v.id('staff')),
    roomNumber: v.optional(v.string()),
    maxStudents: v.number(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      ensureBelongsToSchool(await ctx.db.get(args.gradeId), scopedSchoolId, 'Grade');

      if (args.academicYearId) {
        ensureBelongsToSchool(await ctx.db.get(args.academicYearId), scopedSchoolId, 'Academic year');
      }

      if (args.classTeacherId) {
        ensureBelongsToSchool(await ctx.db.get(args.classTeacherId), scopedSchoolId, 'Staff record');
      }

      const sectionName = args.name.trim();
      if (!sectionName) {
        throwError('VALIDATION', 'Section name cannot be empty.');
      }

      const existing = await ctx.db
        .query('sections')
        .withIndex('by_grade', (q) => q.eq('schoolId', scopedSchoolId).eq('gradeId', args.gradeId))
        .collect();

      const duplicate = existing.find((section) => section.name.toLowerCase() === sectionName.toLowerCase());
      if (duplicate) {
        throwError('CONFLICT', `Section ${sectionName} already exists for this grade.`);
      }

      return ctx.db.insert('sections', {
        schoolId: scopedSchoolId,
        gradeId: args.gradeId,
        academicYearId: args.academicYearId,
        name: sectionName,
        displayName: args.displayName?.trim(),
        classTeacherId: args.classTeacherId,
        roomNumber: args.roomNumber?.trim(),
        maxStudents: args.maxStudents,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
});

export const updateSection = mutation({
  args: {
    sectionId: v.id('sections'),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    classTeacherId: v.optional(v.id('staff')),
    roomNumber: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const section = ensureBelongsToSchool(await ctx.db.get(args.sectionId), scopedSchoolId, 'Section');

      if (args.classTeacherId) {
        ensureBelongsToSchool(await ctx.db.get(args.classTeacherId), scopedSchoolId, 'Staff record');
      }

      let name = section.name;
      if (args.name !== undefined) {
        const trimmedName = args.name.trim();
        if (!trimmedName) {
          throwError('VALIDATION', 'Section name cannot be empty.');
        }

        if (trimmedName.toLowerCase() !== section.name.toLowerCase()) {
          const existing = await ctx.db
            .query('sections')
            .withIndex('by_grade', (q) => q.eq('schoolId', scopedSchoolId).eq('gradeId', section.gradeId))
            .collect();

          const duplicate = existing.find((s) => s.name.toLowerCase() === trimmedName.toLowerCase() && s._id !== section._id);
          if (duplicate) {
            throwError('CONFLICT', `Section ${trimmedName} already exists for this grade.`);
          }
        }
        name = trimmedName;
      }

      await ctx.db.patch(section._id, {
        name,
        displayName: args.displayName?.trim() ?? section.displayName,
        classTeacherId: args.classTeacherId ?? section.classTeacherId,
        roomNumber: args.roomNumber?.trim() ?? section.roomNumber,
        maxStudents: args.maxStudents ?? section.maxStudents,
        isActive: args.isActive ?? section.isActive,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const assignClassTeacher = mutation({
  args: {
    sectionId: v.id('sections'),
    staffId: v.id('staff'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const section = ensureBelongsToSchool(await ctx.db.get(args.sectionId), scopedSchoolId, 'Section');
      ensureBelongsToSchool(await ctx.db.get(args.staffId), scopedSchoolId, 'Staff record');
      await ctx.db.patch(section._id, { classTeacherId: args.staffId, updatedAt: Date.now() });
      return { success: true };
    });
  },
});

export const getSectionsBySchool = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [sections, grades, students, staff] = await Promise.all([
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return sections
        .map((section) => {
          const grade = grades.find((entry) => entry._id === section.gradeId) ?? null;
          const teacher = staff.find((entry) => entry._id === section.classTeacherId) ?? null;
          const studentCount = students.filter((student) => student.currentSectionId === section._id).length;

          return {
            ...section,
            grade,
            classTeacher: teacher,
            studentCount,
            remainingCapacity: Math.max(section.maxStudents - studentCount, 0),
          };
        })
        .sort((a, b) => {
          const levelDiff = (a.grade?.level ?? 0) - (b.grade?.level ?? 0);
          return levelDiff !== 0 ? levelDiff : a.name.localeCompare(b.name);
        });
    });
  },
});

export const getSectionsByGrade = query({
  args: {
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const sections = await ctx.db
        .query('sections')
        .withIndex('by_grade', (q) => q.eq('schoolId', scopedSchoolId).eq('gradeId', args.gradeId))
        .collect();
      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return sections.map((section) => ({
        ...section,
        studentCount: students.filter((student) => student.currentSectionId === section._id).length,
      }));
    });
  },
});

export const getSectionManagementData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [sections, grades, students, staff, academicYears] = await Promise.all([
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('academicYears').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return {
        grades: grades.sort((a, b) => a.level - b.level),
        academicYears: academicYears.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
        teachers: staff
          .filter((entry) => entry.isActive && entry.staffCategory !== 'non_teaching')
          .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
        sections: sections
          .map((section) => {
            const grade = grades.find((entry) => entry._id === section.gradeId) ?? null;
            const classTeacher = staff.find((entry) => entry._id === section.classTeacherId) ?? null;
            const roster = students.filter((student) => student.currentSectionId === section._id);
            return {
              ...section,
              grade,
              classTeacher,
              academicYear: academicYears.find((entry) => entry._id === section.academicYearId) ?? null,
              enrolled: roster.length,
              available: Math.max(section.maxStudents - roster.length, 0),
              roster: roster.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
            };
          })
          .sort((a, b) => (a.grade?.level ?? 0) - (b.grade?.level ?? 0) || a.name.localeCompare(b.name)),
      };
    });
  },
});
