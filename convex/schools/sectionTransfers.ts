import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureBelongsToSchool, ensureSchoolId } from './_helpers';

export const transferBetweenSections = mutation({
  args: {
    studentId: v.id('students'),
    targetSectionId: v.id('sections'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [student, targetSection] = await Promise.all([
        ctx.db.get(args.studentId),
        ctx.db.get(args.targetSectionId),
      ]);

      const ensuredStudent = ensureBelongsToSchool(student, scopedSchoolId, 'Student');
      const ensuredTargetSection = ensureBelongsToSchool(targetSection, scopedSchoolId, 'Section');

      if (!ensuredStudent.currentSectionId) {
        throwError('VALIDATION', 'The selected student is not currently placed in a section.');
      }

      if (ensuredStudent.currentSectionId === args.targetSectionId) {
        throwError('VALIDATION', 'The student is already assigned to the selected section.');
      }

      if (ensuredStudent.currentGradeId !== ensuredTargetSection.gradeId) {
        throwError('VALIDATION', 'Students can only be transferred into another section within the same grade.');
      }

      const studentsInTarget = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();
      const targetCount = studentsInTarget.filter((entry) => entry.currentSectionId === args.targetSectionId).length;
      if (targetCount >= ensuredTargetSection.maxStudents) {
        throwError('CONFLICT', 'The selected section has reached its capacity.');
      }

      await ctx.db.patch(ensuredStudent._id, {
        currentSectionId: args.targetSectionId,
        updatedAt: Date.now(),
      });

      await ctx.db.insert('sectionHistory', {
        schoolId: scopedSchoolId,
        studentId: ensuredStudent._id,
        gradeId: ensuredTargetSection.gradeId,
        sectionId: ensuredTargetSection._id,
        academicYearId: ensuredTargetSection.academicYearId,
        termId: undefined,
        reason: args.reason?.trim() || 'Section transfer',
        effectiveDate: Date.now(),
        createdBy: userId,
        createdAt: Date.now(),
      });

      return { success: true };
    });
  },
});
