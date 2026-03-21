import type { Id } from '../_generated/dataModel';
import { query, type QueryCtx } from '../_generated/server';
import { ensureBelongsToSchool, ensureSchoolId } from '../schools/_helpers';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';

function summariseAttendance(records: Array<{ status: 'present' | 'absent' | 'late' | 'excused' }>) {
  return records.reduce(
    (summary, record) => {
      summary.total += 1;
      if (record.status === 'present') summary.present += 1;
      if (record.status === 'absent') summary.absent += 1;
      if (record.status === 'late') summary.late += 1;
      if (record.status === 'excused') summary.excused += 1;
      return summary;
    },
    { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
  );
}

async function getStudentPortalBundle(
  ctx: QueryCtx,
  studentId: Id<'students'>,
  schoolId: Id<'schools'>,
) {
  const student = ensureBelongsToSchool(await ctx.db.get(studentId), schoolId, 'Student');
  const timetableSlotsPromise = student.currentSectionId
    ? ctx.db.query('timetableSlots').withIndex('by_section', (q) => q.eq('sectionId', student.currentSectionId as Id<'sections'>)).collect()
    : Promise.resolve([]);
  const notificationsPromise = student.userId
    ? ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', student.userId as Id<'users'>)).collect()
    : Promise.resolve([]);

  const [grade, section, attendance, examResults, timetableSlots, notifications, currentAcademicYear, currentTerm] = await Promise.all([
    student.currentGradeId ? ctx.db.get(student.currentGradeId) : null,
    student.currentSectionId ? ctx.db.get(student.currentSectionId) : null,
    ctx.db.query('attendance').withIndex('by_student_date', (q) => q.eq('studentId', student._id)).collect(),
    ctx.db.query('examResults').withIndex('by_student', (q) => q.eq('studentId', student._id)).collect(),
    timetableSlotsPromise,
    notificationsPromise,
    ctx.db.query('academicYears').withIndex('by_current', (q) => q.eq('schoolId', schoolId).eq('isCurrent', true)).unique(),
    ctx.db.query('terms').withIndex('by_current', (q) => q.eq('schoolId', schoolId).eq('isCurrent', true)).unique(),
  ]);

  const attendanceSummary = summariseAttendance(attendance);
  const examAverage = examResults.length > 0
    ? examResults.reduce((sum, result) => sum + (result.marksObtained / result.maxMarks) * 100, 0) / examResults.length
    : null;

  return {
    student,
    grade,
    section,
    attendance,
    attendanceSummary,
    examResults,
    examAverage,
    timetableSlots: timetableSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    notifications: notifications.sort((a, b) => b.createdAt - a.createdAt),
    currentAcademicYear,
    currentTerm,
  };
}

export const getParentDashboard = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.guardianId) {
        throwError('FORBIDDEN', 'Your account is not linked to a guardian profile.');
      }

      const guardian = ensureBelongsToSchool(await ctx.db.get(user.guardianId), scopedSchoolId, 'Guardian');
      const students = await ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect();
      const linkedStudents = students.filter((student) =>
        (student.guardianLinks ?? []).some((link) => link.guardianId === guardian._id),
      );

      const bundles = await Promise.all(
        linkedStudents.map((student) => getStudentPortalBundle(ctx, student._id, scopedSchoolId)),
      );

      const notices = await ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', userId)).collect();

      return {
        guardian,
        children: bundles,
        notices: notices.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      };
    });
  },
});

export const getParentChildProgress = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.guardianId) {
        throwError('FORBIDDEN', 'Your account is not linked to a guardian profile.');
      }

      const guardian = ensureBelongsToSchool(await ctx.db.get(user.guardianId), scopedSchoolId, 'Guardian');
      const students = await ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect();
      const linkedStudents = students.filter((student) =>
        (student.guardianLinks ?? []).some((link) => link.guardianId === guardian._id),
      );

      return Promise.all(linkedStudents.map((student) => getStudentPortalBundle(ctx, student._id, scopedSchoolId)));
    });
  },
});

export const getParentAttendance = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.guardianId) {
        throwError('FORBIDDEN', 'Your account is not linked to a guardian profile.');
      }

      const guardian = ensureBelongsToSchool(await ctx.db.get(user.guardianId), scopedSchoolId, 'Guardian');
      const students = await ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect();
      const linkedStudents = students.filter((student) =>
        (student.guardianLinks ?? []).some((link) => link.guardianId === guardian._id),
      );

      const records = await Promise.all(
        linkedStudents.map(async (student) => {
          const attendance = await ctx.db.query('attendance').withIndex('by_student_date', (q) => q.eq('studentId', student._id)).collect();
          return {
            student,
            attendance: attendance.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
            summary: summariseAttendance(attendance),
          };
        }),
      );

      return records;
    });
  },
});

export const getStudentDashboard = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.studentId) {
        throwError('FORBIDDEN', 'Your account is not linked to a student profile.');
      }

      return getStudentPortalBundle(ctx, user.studentId, scopedSchoolId);
    });
  },
});

export const getStudentNotices = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId }) => {
      return ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', userId)).collect();
    });
  },
});
