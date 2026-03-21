import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from './_helpers';

export const getMyClassOverview = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId, role }) => {
      requirePermission(role, Permission.VIEW_CLASS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.staffId) {
        throwError('FORBIDDEN', 'Your account is not linked to a staff profile.');
      }

      const [staff, sections, students, attendance, examResults, assignments, timetable, currentAcademicYear, notifications] = await Promise.all([
        ctx.db.get(user.staffId),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('attendance').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('examResults').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staffSubjectAssignments').withIndex('by_staff', (q) => q.eq('schoolId', scopedSchoolId).eq('staffId', user.staffId!)).collect(),
        ctx.db.query('timetableSlots').withIndex('by_teacher', (q) => q.eq('teacherId', user.staffId!)).collect(),
        ctx.db.query('academicYears').withIndex('by_current', (q) => q.eq('schoolId', scopedSchoolId).eq('isCurrent', true)).unique(),
        ctx.db.query('notifications').withIndex('by_user', (q) => q.eq('userId', userId)).collect(),
      ]);

      if (!staff || staff.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Your staff profile could not be found.');
      }

      const classSection = sections.find((section) => section.classTeacherId === staff._id) ?? null;
      const roster = classSection
        ? students
            .filter((student) => student.currentSectionId === classSection._id)
            .map((student) => {
              const studentAttendance = attendance.filter((record) => record.studentId === student._id);
              const presentCount = studentAttendance.filter((record) => record.status === 'present').length;
              const average = (() => {
                const results = examResults.filter((result) => result.studentId === student._id);
                return results.length > 0
                  ? results.reduce((sum, result) => sum + (result.marksObtained / result.maxMarks) * 100, 0) / results.length
                  : null;
              })();
              return {
                ...student,
                attendanceThisWeek: `${presentCount}/${studentAttendance.length || 0}`,
                lastResultAverage: average,
              };
            })
            .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
        : [];

      const myTimetable = timetable
        .filter((slot) => !classSection || slot.sectionId === classSection._id)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
      const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const todaysTimetable = myTimetable.filter((slot) => slot.dayOfWeek === todayIndex);

      return {
        staff,
        classSection,
        currentAcademicYear,
        roster,
        assignments,
        timetable: myTimetable,
        todaysTimetable,
        notices: notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      };
    });
  },
});
