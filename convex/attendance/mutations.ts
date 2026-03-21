import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { throwError } from '../_lib/errors';
import { hasFeature } from '../_lib/featureGuard';

const attendanceStatus = v.union(
  v.literal('present'),
  v.literal('absent'),
  v.literal('late'),
  v.literal('excused'),
);

export const markBulkAttendance = mutation({
  args: {
    sectionId: v.id('sections'),
    date: v.string(),
    /** When the school has PERIOD_ATTENDANCE enabled, callers may supply a
     *  timetable slot ID to record period-level attendance. */
    timetableSlotId: v.optional(v.id('timetableSlots')),
    records: v.array(
      v.object({
        studentId: v.id('students'),
        status: attendanceStatus,
        notes: v.optional(v.string()),
        clientId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role, userId }) => {
      requirePermission(role, Permission.MARK_ATTENDANCE);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const school = await ctx.db.get(scopedSchoolId);
      if (!school) throwError('NOT_FOUND', 'School not found.');

      const section = await ctx.db.get(args.sectionId);
      if (!section || section.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The selected section could not be found.');
      }

      // Determine whether period-level attendance is permitted for this school
      const periodAttendanceEnabled = hasFeature(school!, 'PERIOD_ATTENDANCE');

      // If a timetableSlotId was supplied but the feature is off, ignore it
      // silently so older clients continue to work unchanged.
      const resolvedSlotId = periodAttendanceEnabled ? args.timetableSlotId : undefined;

      // Validate the timetable slot belongs to this school when provided
      if (resolvedSlotId) {
        const slot = await ctx.db.get(resolvedSlotId);
        if (!slot || slot.schoolId !== scopedSchoolId) {
          throwError('NOT_FOUND', 'The provided timetable slot could not be found.');
        }
      }

      let created = 0;
      let updated = 0;

      for (const record of args.records) {
        const student = await ctx.db.get(record.studentId);
        if (!student || student.schoolId !== scopedSchoolId || student.currentSectionId !== args.sectionId) {
          throwError('VALIDATION', 'One or more attendance records target an invalid student for this section.');
        }

        // Try to locate an existing record. When period attendance is on we key
        // by (studentId, date, timetableSlotId); otherwise fall back to daily keying.
        const existingByClientId = record.clientId
          ? await ctx.db.query('attendance').withIndex('by_client_id', (q) => q.eq('clientId', record.clientId!)).unique()
          : null;

        let existingByDate = null;
        if (!existingByClientId) {
          const candidates = await ctx.db
            .query('attendance')
            .withIndex('by_student_date', (q) => q.eq('studentId', record.studentId).eq('date', args.date))
            .collect();

          existingByDate = resolvedSlotId
            ? (candidates.find((r) => r.timetableSlotId === resolvedSlotId) ?? null)
            : (candidates[0] ?? null);
        }

        const existing = existingByClientId ?? existingByDate;
        const normalizedNotes = record.notes?.trim() || undefined;
        const previousStatus = existing?.status;

        if (existing) {
          await ctx.db.patch(existing._id, {
            status: record.status,
            notes: normalizedNotes,
            markedBy: userId,
            updatedAt: Date.now(),
          });
          updated += 1;
        } else {
          await ctx.db.insert('attendance', {
            schoolId: scopedSchoolId,
            studentId: record.studentId,
            sectionId: args.sectionId,
            date: args.date,
            status: record.status,
            markedBy: userId,
            termId: undefined,
            timetableSlotId: resolvedSlotId,
            notes: normalizedNotes,
            clientId: record.clientId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          created += 1;
        }

        if (record.status === 'absent' || previousStatus === 'absent') {
          await ctx.scheduler.runAfter(0, internal.notificationsAbsenceAlerts.queueAttendanceStatusAlert, {
            schoolId: scopedSchoolId,
            studentId: record.studentId,
            date: args.date,
            currentStatus: record.status,
            previousStatus,
          });
        }
      }

      return { created, updated, skipped: 0 };
    });
  },
});
