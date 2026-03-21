import { query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from './_helpers';

export const getDashboardStats = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const [students, staff, school] = await Promise.all([
        ctx.db
          .query('students')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
        ctx.db
          .query('staff')
          .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
          .collect(),
        ctx.db.get(scopedSchoolId),
      ]);

      const activeStudents = students.filter((s) => s.enrollmentStatus === 'active').length;
      const activeStaff = staff.filter((s) => s.isActive).length;

      // Today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = await ctx.db
        .query('attendance')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect()
        .then((records) => records.filter((r) => r.date === today));

      const totalMarked = todayAttendance.length;
      const present = todayAttendance.filter(
        (r) => r.status === 'present' || r.status === 'late',
      ).length;
      const attendanceRate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null;

      // Recent notifications for activity feed
      const recentNotifications = await ctx.db
        .query('notifications')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .order('desc')
        .take(8);

      return {
        totalStudents: students.length,
        activeStudents,
        totalStaff: staff.length,
        activeStaff,
        attendanceRate,
        totalMarkedToday: totalMarked,
        smsBalance: school?.smsBalance ?? 0,
        recentActivity: recentNotifications.map((n) => ({
          _id: n._id,
          title: n.title,
          body: n.body,
          type: n.type,
          createdAt: n.createdAt,
          link: n.link,
        })),
      };
    });
  },
});
