import { query } from '../_generated/server';
import { Permission, canDo } from '../_lib/permissions';

export const getDashboardStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Not authenticated
    }

    // Get user from database
    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || !user.isActive) {
      return null; // No user or deactivated
    }

    // Platform admins need explicit school selection
    if (user.role === 'platform_admin') {
      return null; // Dashboard doesn't apply to platform admins
    }

    if (!user.schoolId) {
      return null; // No school assigned
    }

    const schoolId = user.schoolId;
    const role = user.role;

    // Check permission
    if (!canDo(role, Permission.MANAGE_ACADEMICS)) {
      return null; // Insufficient permissions
    }

    const [students, staff, school] = await Promise.all([
      ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect(),
      ctx.db
        .query('staff')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect(),
      ctx.db.get(schoolId),
    ]);

    const activeStudents = students.filter((s) => s.enrollmentStatus === 'active').length;
    const activeStaff = staff.filter((s) => s.isActive).length;

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
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
      .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
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
  },
});
