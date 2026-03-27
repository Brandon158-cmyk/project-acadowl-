import { v } from 'convex/values';
import { query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from '../schools/_helpers';
import {
  canPayFees,
  canSeeAttendance,
  canSeeResults,
  getGuardianForUser,
  getGuardianLinkForStudent,
  getGuardianLinkedStudents,
  requireLinkedStudentAccess,
} from './_helpers';

function toDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function toStartOfWeekDateKey(now = new Date()) {
  const copy = new Date(now);
  const day = copy.getDay();
  const delta = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - delta);
  copy.setHours(0, 0, 0, 0);
  return toDateKey(copy.getTime());
}

export const getGuardianDashboardData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian, user } = await getGuardianForUser(ctx, scopedSchoolId, userId);
      const students = await getGuardianLinkedStudents(ctx, scopedSchoolId, guardian._id);
      const todayKey = toDateKey(Date.now());

      const children = await Promise.all(
        students.map(async (student) => {
          const link = getGuardianLinkForStudent(student, guardian._id);
          const [todayAttendance, allInvoices] = await Promise.all([
            ctx.db
              .query('attendance')
              .withIndex('by_student_date', (q) => q.eq('studentId', student._id).eq('date', todayKey))
              .unique(),
            ctx.db
              .query('invoices')
              .withIndex('by_student', (q) => q.eq('studentId', student._id))
              .collect(),
          ]);

          const outstandingInvoices = allInvoices.filter((invoice) =>
            invoice.status !== 'void' && invoice.balanceZMW > 0,
          );

          const termBalance = outstandingInvoices.reduce((sum, invoice) => sum + invoice.balanceZMW, 0);

          let hasUnreadMessages = false;
          if (user.guardianId && user._id) {
            const threadCandidates = await ctx.db
              .query('messageThreads')
              .withIndex('by_student', (q) => q.eq('studentId', student._id))
              .collect();
            const myThreadIds = threadCandidates
              .filter((thread) => thread.participantIds.includes(user._id))
              .map((thread) => thread._id);

            for (const threadId of myThreadIds) {
              const unread = await ctx.db
                .query('messageNotifications')
                .withIndex('by_user_unread', (q) => q.eq('userId', user._id).eq('isRead', false))
                .collect();
              if (unread.some((item) => item.threadId === threadId)) {
                hasUnreadMessages = true;
                break;
              }
            }
          }

          return {
            student,
            todayAttendance: canSeeAttendance(link) ? todayAttendance?.status ?? null : null,
            termBalance: canPayFees(link) ? termBalance : 0,
            hasUnreleasedResults: false,
            hasNewHomework: false,
            hasUnreadMessages,
            boardingStatus: student.boardingStatus ?? 'day',
          };
        }),
      );

      return {
        guardian,
        children,
      };
    });
  },
});

export const getChildOverviewForGuardian = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian, user } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      const student = await ctx.db.get(args.studentId);
      if (!student || student.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Student not found in your school scope.');
      }

      const link = requireLinkedStudentAccess(student, guardian._id);
      const weekStartKey = toStartOfWeekDateKey();

      const [grade, section, attendance, examResults, invoices, schoolEvents, notices] = await Promise.all([
        student.currentGradeId ? ctx.db.get(student.currentGradeId) : null,
        student.currentSectionId ? ctx.db.get(student.currentSectionId) : null,
        ctx.db
          .query('attendance')
          .withIndex('by_student_date', (q) => q.eq('studentId', student._id))
          .collect(),
        ctx.db
          .query('examResults')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .collect(),
        ctx.db
          .query('invoices')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .collect(),
        ctx.db
          .query('schoolEvents')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
        ctx.db
          .query('notifications')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect(),
      ]);

      const todayKey = toDateKey(Date.now());
      const todayAttendance = attendance.find((entry) => entry.date === todayKey) ?? null;
      const weekly = attendance.filter((entry) => entry.date >= weekStartKey);
      const thisWeekAttendance = weekly.reduce(
        (acc, entry) => {
          acc.total += 1;
          if (entry.status === 'present') acc.present += 1;
          if (entry.status === 'absent') acc.absent += 1;
          if (entry.status === 'late') acc.late += 1;
          return acc;
        },
        { present: 0, absent: 0, late: 0, total: 0 },
      );

      const attendancePercent = attendance.length > 0
        ? Math.round((attendance.filter((entry) => entry.status === 'present').length / attendance.length) * 100)
        : 0;

      const latestResults = examResults
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((entry) => ({
          subjectId: entry.subjectId,
          grade: entry.grade ?? '-',
          percent: Math.round((entry.marksObtained / entry.maxMarks) * 100),
        }));

      const outstandingInvoices = invoices
        .filter((invoice) => invoice.status !== 'void' && invoice.balanceZMW > 0)
        .sort((a, b) => a.dueDate - b.dueDate);

      const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.balanceZMW, 0);
      const nearestDue = outstandingInvoices[0];

      const upcomingEvents = schoolEvents
        .filter((event) => event.visibleToParents)
        .filter((event) => event.startDate >= todayKey)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 3);

      const recentNotifications = notices
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3);

      return {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          grade: grade?.name ?? null,
          section: section?.displayName ?? section?.name ?? null,
          photo: student.avatarUrl ?? null,
          boardingStatus: student.boardingStatus ?? 'day',
        },
        todayAttendance: canSeeAttendance(link)
          ? (todayAttendance
            ? {
              status: todayAttendance.status,
              markedAt: todayAttendance.updatedAt ?? todayAttendance.createdAt,
              markedBy: todayAttendance.markedBy,
            }
            : null)
          : null,
        thisWeekAttendance: canSeeAttendance(link) ? thisWeekAttendance : { present: 0, absent: 0, late: 0, total: 0 },
        currentTermAttendancePercent: canSeeAttendance(link) ? attendancePercent : 0,
        latestResults: canSeeResults(link) ? latestResults : [],
        feeBalance: canPayFees(link)
          ? {
            outstanding: totalOutstanding,
            dueDate: nearestDue ? new Date(nearestDue.dueDate).toISOString().slice(0, 10) : null,
          }
          : null,
        upcomingEvents,
        recentNotifications,
        homework: {
          pending: 0,
          overdue: 0,
        },
      };
    });
  },
});
