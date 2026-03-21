import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from './_helpers';

export const listStaff = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);

      let staff = await ctx.db
        .query('staff')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      // Filter by active status
      if (args.isActive !== undefined) {
        staff = staff.filter((s) => s.isActive === args.isActive);
      }

      // Filter by role
      if (args.role) {
        staff = staff.filter((s) => s.role === args.role);
      }

      // Search by name, employee number, phone
      if (args.search) {
        const term = args.search.toLowerCase();
        staff = staff.filter(
          (s) =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
            s.employeeNumber?.toLowerCase().includes(term) ||
            s.phone?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term),
        );
      }

      return staff.sort((a, b) => a.firstName.localeCompare(b.firstName));
    });
  },
});

export const getStaffDetail = query({
  args: { staffId: v.id('staff') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const staffRecord = await ctx.db.get(args.staffId);
      if (!staffRecord || staffRecord.schoolId !== scopedSchoolId) {
        return null;
      }

      // Get subject assignments
      const assignments = await ctx.db
        .query('staffSubjectAssignments')
        .withIndex('by_staff', (q) => q.eq('schoolId', scopedSchoolId).eq('staffId', args.staffId))
        .collect();

      // Enrich with subject and section names
      const [subjects, sections] = await Promise.all([
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);

      const enrichedAssignments = assignments.map((a) => ({
        ...a,
        subject: subjects.find((s) => s._id === a.subjectId) ?? null,
        section: sections.find((s) => s._id === a.sectionId) ?? null,
      }));

      // Check if they are a class teacher
      const classTeacherSections = sections.filter((s) => s.classTeacherId === args.staffId);

      return {
        ...staffRecord,
        assignments: enrichedAssignments,
        classTeacherSections,
      };
    });
  },
});
