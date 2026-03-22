import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import {
  createSchoolAdminNotification,
  ensureDateRange,
  ensureSchoolId,
  getSchoolOrThrow,
  parseDateString,
} from './_helpers';

export const createAcademicYear = mutation({
  args: {
    year: v.number(),
    label: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const startDate = parseDateString(args.startDate, 'Academic year start date');
      const endDate = parseDateString(args.endDate, 'Academic year end date');
      ensureDateRange(startDate, endDate, 'Academic year');

      const duplicate = await ctx.db
        .query('academicYears')
        .withIndex('by_year', (q) => q.eq('schoolId', scopedSchoolId).eq('year', args.year))
        .unique();

      if (duplicate) {
        throwError('CONFLICT', `Academic year ${args.year} already exists for this school.`);
      }

      const now = Date.now();

      return ctx.db.insert('academicYears', {
        schoolId: scopedSchoolId,
        name: args.label?.trim() || `${args.year} Academic Year`,
        year: args.year,
        startDate,
        endDate,
        isCurrent: false,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      });
    });
  },
});

export const activateAcademicYear = mutation({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const school = await getSchoolOrThrow(ctx, scopedSchoolId);
      const targetYear = await ctx.db.get(args.academicYearId);

      if (!targetYear || targetYear.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The academic year could not be found.');
      }

      const currentYears = await ctx.db
        .query('academicYears')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const now = Date.now();

      await Promise.all(
        currentYears.map((academicYear) =>
          ctx.db.patch(academicYear._id, {
            isCurrent: academicYear._id === args.academicYearId,
            status: academicYear._id === args.academicYearId ? 'active' : academicYear.status === 'closed' ? 'closed' : 'draft',
            updatedAt: now,
          }),
        ),
      );

      await ctx.db.patch(scopedSchoolId, {
        currentAcademicYearId: args.academicYearId,
        updatedAt: now,
      });

      await createSchoolAdminNotification(
        ctx,
        school,
        'Academic year updated',
        `${targetYear.name} is now the active academic year.`,
        '/settings/academic-year',
      );

      return { success: true };
    });
  },
});

export const closeAcademicYear = mutation({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const academicYear = await ctx.db.get(args.academicYearId);

      if (!academicYear || academicYear.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'The academic year could not be found.');
      }

      const activeExamSessions = await ctx.db
        .query('examSessions')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const linkedTerms = await ctx.db
        .query('terms')
        .withIndex('by_academic_year', (q) => q.eq('academicYearId', args.academicYearId))
        .collect();

      const linkedTermIds = new Set(linkedTerms.map((term) => term._id));
      const unresolvedSessions = activeExamSessions.filter(
        (session) => linkedTermIds.has(session.termId) && !session.isLocked,
      );

      if (unresolvedSessions.length > 0) {
        throwError(
          'CONFLICT',
          'Unable to close the academic year while there are exam sessions with unlocked results.',
        );
      }

      const now = Date.now();

      await ctx.db.patch(args.academicYearId, {
        isCurrent: false,
        status: 'closed',
        updatedAt: now,
      });

      const school = await getSchoolOrThrow(ctx, scopedSchoolId);
      if (school.currentAcademicYearId === args.academicYearId) {
        await ctx.db.patch(scopedSchoolId, {
          currentAcademicYearId: undefined,
          updatedAt: now,
        });
      }

      return { success: true };
    });
  },
});

export const getAcademicYears = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const years = await ctx.db
        .query('academicYears')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      return years.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.startDate - a.startDate);
    });
  },
});

export const getCurrentAcademicYear = query({
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

    // Platform admins or users without school assignment - return null
    if (!user.schoolId || user.role === 'platform_admin') {
      return null;
    }

    const schoolId = user.schoolId;

    return ctx.db
      .query('academicYears')
      .withIndex('by_current', (q) => q.eq('schoolId', schoolId).eq('isCurrent', true))
      .unique();
  },
});
