import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId, getDefaultGradesForSchoolType, getSchoolOrThrow } from './_helpers';

export const seedDefaultGrades = mutation({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const school = await getSchoolOrThrow(ctx, scopedSchoolId);
      const existing = await ctx.db
        .query('grades')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      if (existing.length > 0) {
        throwError('CONFLICT', 'Grades have already been configured for this school.');
      }

      const defaults = getDefaultGradesForSchoolType(school.type);
      const now = Date.now();

      return Promise.all(
        defaults.map((grade) =>
          ctx.db.insert('grades', {
            schoolId: scopedSchoolId,
            name: grade.name,
            level: grade.level,
            isActive: true,
            graduationGrade: grade.graduationGrade,
            isEczExamYear: grade.isEczExamYear,
            hasPracticalAssessment: grade.hasPracticalAssessment,
            createdAt: now,
            updatedAt: now,
          }),
        ),
      );
    });
  },
});

export const createGrade = mutation({
  args: {
    name: v.string(),
    level: v.number(),
    graduationGrade: v.optional(v.boolean()),
    isEczExamYear: v.optional(v.boolean()),
    hasPracticalAssessment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const gradeName = args.name.trim();
      if (!gradeName) {
        throwError('VALIDATION', 'Grade name cannot be empty.');
      }

      const duplicate = await ctx.db
        .query('grades')
        .withIndex('by_level', (q) => q.eq('schoolId', scopedSchoolId).eq('level', args.level))
        .unique();

      if (duplicate) {
        throwError('CONFLICT', `A grade already exists at level ${args.level}.`);
      }

      return ctx.db.insert('grades', {
        schoolId: scopedSchoolId,
        name: gradeName,
        level: args.level,
        isActive: true,
        graduationGrade: args.graduationGrade ?? false,
        isEczExamYear: args.isEczExamYear ?? false,
        hasPracticalAssessment: args.hasPracticalAssessment ?? false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
});

export const updateGrade = mutation({
  args: {
    gradeId: v.id('grades'),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    graduationGrade: v.optional(v.boolean()),
    isEczExamYear: v.optional(v.boolean()),
    hasPracticalAssessment: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const grade = await ctx.db.get(args.gradeId);

      if (!grade || grade.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The grade could not be found.');
      }

      if (args.level !== undefined && args.level !== grade.level) {
        const duplicate = await ctx.db
          .query('grades')
          .withIndex('by_level', (q) => q.eq('schoolId', scopedSchoolId).eq('level', args.level!))
          .unique();

        if (duplicate && duplicate._id !== grade._id) {
          throwError('CONFLICT', `Another grade already uses level ${args.level}.`);
        }
      }

      let name = grade.name;
      if (args.name !== undefined) {
        const trimmedName = args.name.trim();
        if (!trimmedName) {
          throwError('VALIDATION', 'Grade name cannot be empty.');
        }
        name = trimmedName;
      }

      await ctx.db.patch(grade._id, {
        name,
        level: args.level ?? grade.level,
        isActive: args.isActive ?? grade.isActive,
        graduationGrade: args.graduationGrade ?? grade.graduationGrade,
        isEczExamYear: args.isEczExamYear ?? grade.isEczExamYear,
        hasPracticalAssessment: args.hasPracticalAssessment ?? grade.hasPracticalAssessment,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const getGradesBySchool = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const grades = await ctx.db
        .query('grades')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return grades.sort((a, b) => a.level - b.level);
    });
  },
});

export const getGradeOverview = query({
  args: {
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const grade = await ctx.db.get(args.gradeId);

      if (!grade || grade.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The grade could not be found.');
      }

      const [sections, students, subjects] = await Promise.all([
        ctx.db.query('sections').withIndex('by_grade', (q) => q.eq('schoolId', scopedSchoolId).eq('gradeId', grade._id)).collect(),
        ctx.db.query('students').withIndex('by_grade', (q) => q.eq('schoolId', scopedSchoolId).eq('currentGradeId', grade._id)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return {
        grade,
        sectionCount: sections.length,
        studentCount: students.length,
        subjects: subjects.filter((subject) => subject.gradeIds?.includes(grade._id)),
      };
    });
  },
});
