import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureBelongsToSchool, ensureSchoolId } from './_helpers';

const schoolEventType = v.union(
  v.literal('holiday'),
  v.literal('exam_period'),
  v.literal('sports_day'),
  v.literal('school_closure'),
  v.literal('parent_teacher'),
  v.literal('general'),
);

export const createSchoolEvent = mutation({
  args: {
    academicYearId: v.id('academicYears'),
    termId: v.optional(v.id('terms')),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: schoolEventType,
    affectsAttendance: v.boolean(),
    visibleToParents: v.boolean(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);

      ensureBelongsToSchool(await ctx.db.get(args.academicYearId), scopedSchoolId, 'Academic year');
      if (args.termId) {
        ensureBelongsToSchool(await ctx.db.get(args.termId), scopedSchoolId, 'Term');
      }

      return ctx.db.insert('schoolEvents', {
        schoolId: scopedSchoolId,
        academicYearId: args.academicYearId,
        termId: args.termId,
        title: args.title.trim(),
        description: args.description?.trim(),
        startDate: args.startDate,
        endDate: args.endDate,
        type: args.type,
        affectsAttendance: args.affectsAttendance,
        visibleToParents: args.visibleToParents,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
});

export const updateSchoolEvent = mutation({
  args: {
    eventId: v.id('schoolEvents'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(schoolEventType),
    affectsAttendance: v.optional(v.boolean()),
    visibleToParents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      const event = ensureBelongsToSchool(await ctx.db.get(args.eventId), scopedSchoolId, 'School event');

      await ctx.db.patch(event._id, {
        title: args.title?.trim() ?? event.title,
        description: args.description?.trim() ?? event.description,
        startDate: args.startDate ?? event.startDate,
        endDate: args.endDate ?? event.endDate,
        type: args.type ?? event.type,
        affectsAttendance: args.affectsAttendance ?? event.affectsAttendance,
        visibleToParents: args.visibleToParents ?? event.visibleToParents,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const deleteSchoolEvent = mutation({
  args: {
    eventId: v.id('schoolEvents'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);
      const scopedSchoolId = ensureSchoolId(schoolId);
      ensureBelongsToSchool(await ctx.db.get(args.eventId), scopedSchoolId, 'School event');
      await ctx.db.delete(args.eventId);
      return { success: true };
    });
  },
});

export const getEventsForDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const events = await ctx.db
        .query('schoolEvents')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return events
        .filter((event) => event.startDate <= args.endDate && event.endDate >= args.startDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
  },
});

export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const today = new Date().toISOString().slice(0, 10);
      const events = await ctx.db
        .query('schoolEvents')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return events
        .filter((event) => event.endDate >= today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, args.limit ?? 5);
    });
  },
});

export const isSchoolDay = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const target = Date.parse(args.date);

      if (Number.isNaN(target)) {
        throwError('VALIDATION', 'Date must be valid.');
      }

      const day = new Date(target).getUTCDay();
      if (day === 0 || day === 6) {
        return false;
      }

      const events = await ctx.db
        .query('schoolEvents')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const blockingEvent = events.find(
        (event) => event.affectsAttendance && event.startDate <= args.date && event.endDate >= args.date,
      );

      return !blockingEvent;
    });
  },
});
