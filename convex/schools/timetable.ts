import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureBelongsToSchool, ensureSchoolId } from './_helpers';

function timeOverlaps(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export const createTimetableSlot = mutation({
  args: {
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
    teacherId: v.optional(v.id('staff')),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    room: v.optional(v.string()),
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [section, subject, teacher] = await Promise.all([
        ctx.db.get(args.sectionId),
        ctx.db.get(args.subjectId),
        args.teacherId ? ctx.db.get(args.teacherId) : null,
      ]);

      ensureBelongsToSchool(section, scopedSchoolId, 'Section');
      ensureBelongsToSchool(subject, scopedSchoolId, 'Subject');
      if (teacher) ensureBelongsToSchool(teacher, scopedSchoolId, 'Staff record');

      const slots = await ctx.db.query('timetableSlots').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect();
      const teacherConflict = args.teacherId
        ? slots.find((slot) => slot.teacherId === args.teacherId && slot.dayOfWeek === args.dayOfWeek && timeOverlaps(slot.startTime, slot.endTime, args.startTime, args.endTime))
        : null;
      if (teacherConflict) {
        throwError('CONFLICT', 'The selected teacher is already assigned to another timetable slot during this period.');
      }

      const roomConflict = args.room
        ? slots.find((slot) => slot.room === args.room && slot.dayOfWeek === args.dayOfWeek && timeOverlaps(slot.startTime, slot.endTime, args.startTime, args.endTime))
        : null;
      if (roomConflict) {
        throwError('CONFLICT', 'The selected room is already in use during this time.');
      }

      const sectionConflict = slots.find((slot) => slot.sectionId === args.sectionId && slot.dayOfWeek === args.dayOfWeek && timeOverlaps(slot.startTime, slot.endTime, args.startTime, args.endTime));
      if (sectionConflict) {
        throwError('CONFLICT', 'This section already has a timetable slot during the selected time.');
      }

      const now = Date.now();
      return ctx.db.insert('timetableSlots', {
        schoolId: scopedSchoolId,
        sectionId: args.sectionId,
        subjectId: args.subjectId,
        teacherId: args.teacherId,
        dayOfWeek: args.dayOfWeek,
        startTime: args.startTime,
        endTime: args.endTime,
        room: args.room,
        termId: args.termId,
        createdAt: now,
        updatedAt: now,
      });
    });
  },
});

export const deleteTimetableSlot = mutation({
  args: { slotId: v.id('timetableSlots') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const slot = ensureBelongsToSchool(await ctx.db.get(args.slotId), scopedSchoolId, 'Timetable slot');
      await ctx.db.delete(slot._id);
      return { success: true };
    });
  },
});

export const getTimetableForSection = query({
  args: { sectionId: v.id('sections') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const section = ensureBelongsToSchool(await ctx.db.get(args.sectionId), scopedSchoolId, 'Section');
      const [slots, subjects, staff] = await Promise.all([
        ctx.db.query('timetableSlots').withIndex('by_section', (q) => q.eq('sectionId', args.sectionId)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staff').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);
      return {
        section,
        slots: slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((slot) => ({
          ...slot,
          subject: subjects.find((subject) => subject._id === slot.subjectId) ?? null,
          teacher: staff.find((entry) => entry._id === slot.teacherId) ?? null,
        })),
      };
    });
  },
});

export const getTimetableForStaff = query({
  args: { staffId: v.id('staff') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      ensureBelongsToSchool(await ctx.db.get(args.staffId), scopedSchoolId, 'Staff record');
      const [slots, subjects, sections] = await Promise.all([
        ctx.db.query('timetableSlots').withIndex('by_teacher', (q) => q.eq('teacherId', args.staffId)).collect(),
        ctx.db.query('subjects').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
      ]);
      return slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((slot) => ({
        ...slot,
        subject: subjects.find((subject) => subject._id === slot.subjectId) ?? null,
        section: sections.find((section) => section._id === slot.sectionId) ?? null,
      }));
    });
  },
});

export const getTimetableBuilderData = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_ACADEMICS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const [sections, assignments, currentTerm, currentAcademicYear] = await Promise.all([
        ctx.db.query('sections').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('staffSubjectAssignments').withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId)).collect(),
        ctx.db.query('terms').withIndex('by_current', (q) => q.eq('schoolId', scopedSchoolId).eq('isCurrent', true)).unique(),
        ctx.db.query('academicYears').withIndex('by_current', (q) => q.eq('schoolId', scopedSchoolId).eq('isCurrent', true)).unique(),
      ]);
      return {
        sections: sections.filter((section) => section.isActive),
        assignments,
        currentTerm,
        currentAcademicYear,
      };
    });
  },
});
