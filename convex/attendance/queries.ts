import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { throwError } from '../_lib/errors';

export const getRegisterForSection = query({
  args: {
    sectionId: v.id('sections'),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MARK_ATTENDANCE);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [section, students, attendance] = await Promise.all([
        ctx.db.get(args.sectionId),
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('attendance').withIndex('by_section_date', (q) => q.eq('sectionId', args.sectionId).eq('date', args.date)).collect(),
      ]);

      if (!section || section.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The selected section could not be found.');
      }

      const roster = students
        .filter((student) => student.currentSectionId === args.sectionId)
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
        .map((student) => ({
          ...student,
          attendance: attendance.find((record) => record.studentId === student._id) ?? null,
        }));

      return {
        section,
        date: args.date,
        roster,
      };
    });
  },
});

export const getTeacherRegisterContext = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ userId, schoolId, role }) => {
      requirePermission(role, Permission.MARK_ATTENDANCE);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const user = await ctx.db.get(userId);
      if (!user?.staffId) {
        throwError('FORBIDDEN', 'Your account is not linked to a staff profile.');
      }

      const [staff, sections, assignments] = await Promise.all([
        ctx.db.get(user.staffId),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staffSubjectAssignments').withIndex('by_staff', (q) => q.eq('schoolId', scopedSchoolId).eq('staffId', user.staffId!)).collect(),
      ]);

      if (!staff || staff.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Your staff profile could not be found.');
      }

      const sectionMap = new Map(sections.map((section) => [section._id, section]));
      const availableSectionIds = Array.from(
        new Set(
          assignments
            .map((assignment) => assignment.sectionId)
            .concat(sections.filter((section) => section.classTeacherId === staff._id).map((section) => section._id)),
        ),
      ).filter((sectionId): sectionId is NonNullable<typeof sectionId> => Boolean(sectionId));
      const availableSections = availableSectionIds
        .map((sectionId) => sectionMap.get(sectionId))
        .filter((section): section is NonNullable<typeof section> => Boolean(section))
        .sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name));

      return {
        staff,
        sections: availableSections,
      };
    });
  },
});

export const getAttendanceAnalytics = query({
  args: {
    /** ISO date range — e.g. "2025-01-06" to "2025-01-31" */
    startDate: v.string(),
    endDate: v.string(),
    /** Optional filter: restrict to a specific grade */
    gradeId: v.optional(v.id('grades')),
    /** Optional filter: restrict to a specific section */
    sectionId: v.optional(v.id('sections')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const [allStudents, allSections, allGrades, allAttendance] = await Promise.all([
        ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('grades').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('attendance').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      // Apply filters
      const filteredStudents = allStudents.filter((s) => {
        if (s.enrollmentStatus !== 'active') return false;
        if (args.gradeId && s.currentGradeId !== args.gradeId) return false;
        if (args.sectionId && s.currentSectionId !== args.sectionId) return false;
        return true;
      });

      const studentIds = new Set(filteredStudents.map((s) => s._id));

      // Only attendance records within the date range for matched students
      const rangeAttendance = allAttendance.filter(
        (r) => r.date >= args.startDate && r.date <= args.endDate && studentIds.has(r.studentId),
      );

      // ── Summary totals ─────────────────────────────────────────────────
      const totals = rangeAttendance.reduce(
        (acc, r) => {
          acc.total++;
          if (r.status === 'present') acc.present++;
          else if (r.status === 'absent') acc.absent++;
          else if (r.status === 'late') acc.late++;
          else if (r.status === 'excused') acc.excused++;
          return acc;
        },
        { total: 0, present: 0, absent: 0, late: 0, excused: 0 },
      );

      // ── Daily breakdown (for chart) ─────────────────────────────────────
      const dailyMap = new Map<string, { present: number; absent: number; late: number; excused: number }>();
      for (const r of rangeAttendance) {
        const entry = dailyMap.get(r.date) ?? { present: 0, absent: 0, late: 0, excused: 0 };
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
        else if (r.status === 'excused') entry.excused++;
        dailyMap.set(r.date, entry);
      }
      const daily = Array.from(dailyMap.entries())
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ── Per-section breakdown ───────────────────────────────────────────
      const sectionMap = new Map(allSections.map((s) => [s._id, s]));
      const gradeMap = new Map(allGrades.map((g) => [g._id, g]));
      const sectionStats = new Map<
        string,
        { sectionId: string; name: string; gradeName: string; present: number; absent: number; late: number; total: number }
      >();

      for (const r of rangeAttendance) {
        const student = filteredStudents.find((s) => s._id === r.studentId);
        if (!student?.currentSectionId) continue;
        const sid = student.currentSectionId;
        const section = sectionMap.get(sid);
        const grade = section?.gradeId ? gradeMap.get(section.gradeId) : undefined;
        const entry = sectionStats.get(sid) ?? {
          sectionId: sid,
          name: section?.displayName ?? section?.name ?? sid,
          gradeName: grade?.name ?? '',
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
        entry.total++;
        if (r.status === 'present') entry.present++;
        else if (r.status === 'absent') entry.absent++;
        else if (r.status === 'late') entry.late++;
        sectionStats.set(sid, entry);
      }

      // ── Top absentees ───────────────────────────────────────────────────
      const absenteeMap = new Map<string, number>();
      for (const r of rangeAttendance) {
        if (r.status === 'absent') {
          absenteeMap.set(r.studentId, (absenteeMap.get(r.studentId) ?? 0) + 1);
        }
      }
      const topAbsentees = Array.from(absenteeMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([studentId, count]) => {
          const student = filteredStudents.find((s) => s._id === studentId);
          return {
            studentId,
            name: student ? `${student.firstName} ${student.lastName}` : studentId,
            studentNumber: student?.studentNumber ?? '',
            absentCount: count,
          };
        });

      return {
        totals,
        daily,
        bySections: Array.from(sectionStats.values()).sort((a, b) => b.absent - a.absent),
        topAbsentees,
        grades: allGrades.sort((a, b) => a.level - b.level),
        sections: allSections.sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)),
      };
    });
  },
});
