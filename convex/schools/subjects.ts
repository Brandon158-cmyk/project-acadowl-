import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import {
  ensureBelongsToSchool,
  ensureSchoolId,
  getDefaultSubjectsForSchoolType,
  getSchoolOrThrow,
  normalizeCode,
} from './_helpers';

const subjectCategory = v.union(
  v.literal('core'),
  v.literal('elective'),
  v.literal('technical'),
  v.literal('custom'),
);

async function validateGradeAssignments(
  ctx: MutationCtx,
  schoolId: Id<'schools'>,
  gradeIds: Id<'grades'>[],
) {
  await Promise.all(
    gradeIds.map(async (gradeId) => {
      const grade = await ctx.db.get(gradeId);
      if (!grade || grade.schoolId !== schoolId) {
        throwError('VALIDATION', 'One or more assigned grades are invalid for this school.');
      }
    }),
  );
}

export const createSubject = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    gradeIds: v.array(v.id('grades')),
    isCompulsory: v.boolean(),
    eczSubjectCode: v.optional(v.string()),
    isStemSubject: v.optional(v.boolean()),
    theoryWeight: v.optional(v.number()),
    practicalWeight: v.optional(v.number()),
    category: v.optional(subjectCategory),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const code = normalizeCode(args.code);
      const duplicate = await ctx.db
        .query('subjects')
        .withIndex('by_code', (q) => q.eq('schoolId', scopedSchoolId).eq('code', code))
        .unique();

      if (duplicate) {
        throwError('CONFLICT', `A subject with code ${code} already exists.`);
      }

      await validateGradeAssignments(ctx, scopedSchoolId, args.gradeIds);

      return ctx.db.insert('subjects', {
        schoolId: scopedSchoolId,
        name: args.name.trim(),
        code,
        isCore: args.category ? args.category === 'core' : args.isCompulsory,
        category: args.category ?? (args.isCompulsory ? 'core' : 'elective'),
        gradeIds: args.gradeIds,
        isCompulsory: args.isCompulsory,
        isStemSubject: args.isStemSubject ?? false,
        theoryWeight: args.theoryWeight,
        practicalWeight: args.practicalWeight,
        eczSubjectCode: args.eczSubjectCode?.trim(),
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
});

export const updateSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    gradeIds: v.optional(v.array(v.id('grades'))),
    isCompulsory: v.optional(v.boolean()),
    eczSubjectCode: v.optional(v.string()),
    isStemSubject: v.optional(v.boolean()),
    theoryWeight: v.optional(v.number()),
    practicalWeight: v.optional(v.number()),
    category: v.optional(subjectCategory),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const subject = ensureBelongsToSchool(await ctx.db.get(args.subjectId), scopedSchoolId, 'Subject');

      const nextCode = args.code ? normalizeCode(args.code) : subject.code;
      if (nextCode && nextCode !== subject.code) {
        const duplicate = await ctx.db
          .query('subjects')
          .withIndex('by_code', (q) => q.eq('schoolId', scopedSchoolId).eq('code', nextCode))
          .unique();

        if (duplicate && duplicate._id !== subject._id) {
          throwError('CONFLICT', `A subject with code ${nextCode} already exists.`);
        }
      }

      const nextGradeIds = args.gradeIds ?? subject.gradeIds ?? [];
      await validateGradeAssignments(ctx, scopedSchoolId, nextGradeIds);

      await ctx.db.patch(subject._id, {
        name: args.name?.trim() ?? subject.name,
        code: nextCode,
        gradeIds: nextGradeIds,
        isCompulsory: args.isCompulsory ?? subject.isCompulsory,
        isCore: args.category ? args.category === 'core' : args.isCompulsory ?? subject.isCore,
        category: args.category ?? subject.category,
        eczSubjectCode: args.eczSubjectCode?.trim() ?? subject.eczSubjectCode,
        isStemSubject: args.isStemSubject ?? subject.isStemSubject,
        theoryWeight: args.theoryWeight ?? subject.theoryWeight,
        practicalWeight: args.practicalWeight ?? subject.practicalWeight,
        isActive: args.isActive ?? subject.isActive,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const deactivateSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const subject = ensureBelongsToSchool(await ctx.db.get(args.subjectId), scopedSchoolId, 'Subject');
      await ctx.db.patch(subject._id, { isActive: false, updatedAt: Date.now() });
      return { success: true };
    });
  },
});

export const seedDefaultSubjects = mutation({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const school = await getSchoolOrThrow(ctx, scopedSchoolId);
      const grades = await ctx.db
        .query('grades')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();
      const existing = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      if (existing.length > 0) {
        throwError('CONFLICT', 'Subjects have already been configured for this school.');
      }

      const defaults = getDefaultSubjectsForSchoolType(school.type);
      const gradeIds = grades.map((grade) => grade._id);
      const now = Date.now();

      return Promise.all(
        defaults.map((subject) =>
          ctx.db.insert('subjects', {
            schoolId: scopedSchoolId,
            name: subject.name,
            code: subject.code,
            isCore: subject.category === 'core',
            category: subject.category,
            gradeIds,
            isCompulsory: subject.isCompulsory,
            isStemSubject: subject.isStemSubject ?? false,
            eczSubjectCode: subject.eczSubjectCode,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }),
        ),
      );
    });
  },
});

export const getSubjectsByGrade = query({
  args: {
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const subjects = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return subjects
        .filter((subject) => subject.isActive && (subject.gradeIds?.includes(args.gradeId) ?? false))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});

export const getSubjectsBySchool = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [subjects, sections, assignments, results] = await Promise.all([
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staffSubjectAssignments').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('examResults').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return subjects
        .map((subject) => {
          const subjectSections = sections.filter((section) =>
            assignments.some(
              (assignment) => assignment.subjectId === subject._id && assignment.sectionId === section._id,
            ),
          );
          const subjectResults = results.filter((result) => result.subjectId === subject._id);
          const averageScore =
            subjectResults.length > 0
              ? subjectResults.reduce((sum, result) => sum + (result.marksObtained / result.maxMarks) * 100, 0) /
                subjectResults.length
              : null;

          return {
            ...subject,
            sectionCount: subjectSections.length,
            teacherAssignmentCount: assignments.filter((assignment) => assignment.subjectId === subject._id).length,
            recentExamAverage: averageScore,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});
