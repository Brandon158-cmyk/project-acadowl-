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
