import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureBelongsToSchool } from '../schools/_helpers';
import { getStudentEnabledSchool } from './_helpers';

export const getEnrollmentFormData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { school, schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);

      const [grades, sections] = await Promise.all([
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      return {
        school,
        grades: grades.sort((a, b) => a.level - b.level),
        sections: sections.sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
  },
});

export const listStudents = query({
  args: {
    search: v.optional(v.string()),
    gradeId: v.optional(v.id('grades')),
    sectionId: v.optional(v.id('sections')),
    enrollmentStatus: v.optional(
      v.union(v.literal('active'), v.literal('suspended'), v.literal('graduated'), v.literal('transferred'), v.literal('dropped_out')),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);

      const [students, grades, sections, guardians] = await Promise.all([
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('guardians').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      const searchValue = args.search?.trim().toLowerCase();

      return students
        .filter((student) => {
          if (args.gradeId && student.currentGradeId !== args.gradeId) return false;
          if (args.sectionId && student.currentSectionId !== args.sectionId) return false;
          if (args.enrollmentStatus && student.enrollmentStatus !== args.enrollmentStatus) return false;
          if (!searchValue) return true;

          const guardianNames = (student.guardianLinks ?? [])
            .map((link) => guardians.find((guardian) => guardian._id === link.guardianId))
            .filter(Boolean)
            .map((guardian) => `${guardian!.firstName} ${guardian!.lastName}`.toLowerCase())
            .join(' ');

          return [
            `${student.firstName} ${student.lastName}`.toLowerCase(),
            student.studentNumber.toLowerCase(),
            student.email?.toLowerCase() ?? '',
            student.phone?.toLowerCase() ?? '',
            guardianNames,
          ].some((value) => value.includes(searchValue));
        })
        .map((student) => ({
          ...student,
          grade: grades.find((grade) => grade._id === student.currentGradeId) ?? null,
          section: sections.find((section) => section._id === student.currentSectionId) ?? null,
          guardians: (student.guardianLinks ?? [])
            .map((link) => {
              const guardian = guardians.find((entry) => entry._id === link.guardianId);
              return guardian ? { ...guardian, isPrimary: link.isPrimary, relationship: link.relationship } : null;
            })
            .filter(Boolean),
        }))
        .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
    });
  },
});

export const searchStudents = query({
  args: {
    term: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);
      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();
      const term = args.term.trim().toLowerCase();

      return students
        .filter((student) =>
          [`${student.firstName} ${student.lastName}`, student.studentNumber, student.email ?? '', student.phone ?? '']
            .join(' ')
            .toLowerCase()
            .includes(term),
        )
        .slice(0, 20);
    });
  },
});

export const getStudentProfile = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STUDENTS);
      const { school, schoolId: scopedSchoolId } = await getStudentEnabledSchool(ctx, schoolId);
      const student = ensureBelongsToSchool(await ctx.db.get(args.studentId), scopedSchoolId, 'Student');

      const [grade, section, guardians, sectionHistory, attendance, examResults] = await Promise.all([
        student.currentGradeId ? ctx.db.get(student.currentGradeId) : null,
        student.currentSectionId ? ctx.db.get(student.currentSectionId) : null,
        Promise.all(
          (student.guardianLinks ?? []).map(async (link) => {
            const guardian = await ctx.db.get(link.guardianId);
            return guardian ? { ...guardian, isPrimary: link.isPrimary, relationship: link.relationship } : null;
          }),
        ),
        ctx.db.query('sectionHistory').withIndex('by_student', (q) => q.eq('schoolId', scopedSchoolId).eq('studentId', student._id)).collect(),
        ctx.db.query('attendance').withIndex('by_student_date', (q) => q.eq('studentId', student._id)).collect(),
        ctx.db.query('examResults').withIndex('by_student', (q) => q.eq('studentId', student._id)).collect(),
      ]);

      const attendanceSummary = attendance.reduce(
        (summary, record) => {
          summary.total += 1;
          if (record.status === 'present') summary.present += 1;
          if (record.status === 'absent') summary.absent += 1;
          if (record.status === 'late') summary.late += 1;
          return summary;
        },
        { total: 0, present: 0, absent: 0, late: 0 },
      );

      const examAverage =
        examResults.length > 0
          ? examResults.reduce((sum, result) => sum + (result.marksObtained / result.maxMarks) * 100, 0) / examResults.length
          : null;

      return {
        school,
        student,
        grade,
        section,
        guardians: guardians.filter(Boolean),
        sectionHistory: sectionHistory.sort((a, b) => b.effectiveDate - a.effectiveDate),
        attendanceSummary,
        examAverage,
      };
    });
  },
});
