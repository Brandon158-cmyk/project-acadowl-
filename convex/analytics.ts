import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, internalQuery, query } from './_generated/server';

function asDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getWeekNumber(termStartTimestamp: number, nowTimestamp: number) {
  const elapsedDays = Math.max(0, Math.floor((nowTimestamp - termStartTimestamp) / (24 * 60 * 60 * 1000)));
  return Math.floor(elapsedDays / 7) + 1;
}

export const getSchoolByIdInternal = internalQuery({
  args: {
    schoolId: v.id('schools'),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.schoolId);
  },
});

export const getSnapshotByIdInternal = internalQuery({
  args: {
    snapshotId: v.id('studentProgressSnapshots'),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.snapshotId);
  },
});

export const getStudentByIdInternal = internalQuery({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.studentId);
  },
});

export const getGuardianByIdInternal = internalQuery({
  args: {
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.guardianId);
  },
});

export const writeProgressSnapshots = internalMutation({
  args: {
    schoolId: v.optional(v.id('schools')),
  },
  handler: async (ctx, args) => {
    const activeSchools = args.schoolId
      ? [await ctx.db.get(args.schoolId)].filter(Boolean)
      : await ctx.db
        .query('schools')
        .withIndex('by_active', (q) => q.eq('isActive', true))
        .collect();

    let created = 0;
    let updated = 0;

    for (const school of activeSchools) {
      if (!school) {
        continue;
      }

      const termId = school.currentTermId;
      if (!termId) {
        continue;
      }

      const term = await ctx.db.get(termId);
      if (!term) {
        continue;
      }

      const now = Date.now();
      const weekNumber = getWeekNumber(term.startDate, now);
      const snapshotDate = asDateKey(now);

      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .collect();

      const snapshotIdsForDigest: Array<any> = [];

      for (const student of students) {
        if (!student.currentSectionId || student.enrollmentStatus !== 'active') {
          continue;
        }

        const [attendance, examResults, invoices, submissions, existingSnapshots] = await Promise.all([
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
            .withIndex('by_student_term', (q) => q.eq('studentId', student._id).eq('termId', term._id))
            .collect(),
          ctx.db
            .query('lmsSubmissions')
            .withIndex('by_student', (q) => q.eq('studentId', student._id))
            .collect(),
          ctx.db
            .query('studentProgressSnapshots')
            .withIndex('by_student_term', (q) => q.eq('studentId', student._id).eq('termId', term._id))
            .collect(),
        ]);

        const weekAttendance = attendance.filter((entry) =>
          entry.date >= asDateKey(now - (7 * 24 * 60 * 60 * 1000)),
        );

        const presentWeek = weekAttendance.filter((entry) => entry.status === 'present').length;
        const attendancePercentThisWeek = weekAttendance.length > 0
          ? Math.round((presentWeek / weekAttendance.length) * 100)
          : 0;

        const presentTerm = attendance.filter((entry) => entry.status === 'present').length;
        const attendancePercentThisTerm = attendance.length > 0
          ? Math.round((presentTerm / attendance.length) * 100)
          : 0;

        const latestExamAverage = examResults.length > 0
          ? Math.round(
            examResults.reduce((sum, result) => sum + ((result.marksObtained / result.maxMarks) * 100), 0)
            / examResults.length,
          )
          : undefined;

        const feeBalanceZMW = invoices
          .filter((invoice) => invoice.status !== 'void')
          .reduce((sum, invoice) => sum + invoice.balanceZMW, 0);

        const nearestOverdueInvoice = invoices
          .filter((invoice) => invoice.balanceZMW > 0 && invoice.dueDate < now)
          .sort((a, b) => a.dueDate - b.dueDate)[0] ?? null;

        const daysOverdue = nearestOverdueInvoice
          ? Math.floor((now - nearestOverdueInvoice.dueDate) / (24 * 60 * 60 * 1000))
          : 0;

        const snapshotPayload = {
          schoolId: school._id,
          studentId: student._id,
          sectionId: student.currentSectionId,
          termId: term._id,
          weekNumber,
          snapshotDate,
          attendancePercentThisWeek,
          attendancePercentThisTerm,
          consecutiveAbsences: 0,
          latestExamAverage,
          lastExamSessionId: examResults.sort((a, b) => b.createdAt - a.createdAt)[0]?.examSessionId,
          subjectsBelowPassMark: 0,
          homeworkSubmissionRate: submissions.length > 0 ? 100 : 0,
          homeworkOverdueCount: 0,
          feeBalanceZMW,
          daysOverdue,
          nightPrepAttendancePercent: undefined,
          sickBayVisitsThisTerm: undefined,
          riskScore: undefined,
          riskFlags: undefined,
          createdAt: now,
        };

        const existing = existingSnapshots.find((snapshot) =>
          snapshot.weekNumber === weekNumber && snapshot.snapshotDate === snapshotDate,
        );

        if (existing) {
          await ctx.db.patch(existing._id, snapshotPayload);
          snapshotIdsForDigest.push(existing._id);
          updated += 1;
        } else {
          const snapshotId = await ctx.db.insert('studentProgressSnapshots', snapshotPayload);
          snapshotIdsForDigest.push(snapshotId);
          created += 1;
        }
      }

      if (snapshotIdsForDigest.length > 0) {
        await ctx.scheduler.runAfter(0, internal.guardian.weeklyDigest.sendWeeklyDigestSMS, {
          schoolId: school._id,
          snapshotIds: snapshotIdsForDigest,
        });
      }
    }

    return { created, updated };
  },
});

export const getProgressSnapshots = query({
  args: {
    studentId: v.id('students'),
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    const snapshots = args.termId
      ? await ctx.db
        .query('studentProgressSnapshots')
        .withIndex('by_student_term', (q) => q.eq('studentId', args.studentId).eq('termId', args.termId!))
        .collect()
      : await ctx.db
        .query('studentProgressSnapshots')
        .withIndex('by_student_term', (q) => q.eq('studentId', args.studentId))
        .collect();

    return snapshots
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 12);
  },
});
