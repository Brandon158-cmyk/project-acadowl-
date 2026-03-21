import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { throwError } from '../_lib/errors';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import {
  createSchoolAdminNotification,
  ensureBelongsToSchool,
  ensureDateRange,
  ensureSchoolId,
  getSchoolOrThrow,
} from './_helpers';

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export const createTerms = mutation({
  args: {
    academicYearId: v.id('academicYears'),
    terms: v.array(
      v.object({
        name: v.string(),
        startDate: v.number(),
        endDate: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const school = await getSchoolOrThrow(ctx, scopedSchoolId);
      const academicYear = ensureBelongsToSchool(
        await ctx.db.get(args.academicYearId),
        scopedSchoolId,
        'Academic year',
      );

      if (args.terms.length === 0) {
        throwError('VALIDATION', 'At least one term must be provided.');
      }

      if (school.academicMode === 'semester' && args.terms.length !== 2) {
        throwError('VALIDATION', 'Semester-mode schools must have exactly two terms.');
      }

      if ((school.academicMode ?? 'term') === 'term' && (args.terms.length < 2 || args.terms.length > 4)) {
        throwError('VALIDATION', 'Term-mode schools must have between two and four terms.');
      }

      const sortedTerms = [...args.terms].sort((a, b) => a.startDate - b.startDate);

      sortedTerms.forEach((term, index) => {
        ensureDateRange(term.startDate, term.endDate, term.name);

        if (term.startDate < academicYear.startDate || term.endDate > academicYear.endDate) {
          throwError('VALIDATION', `${term.name} must fall within the selected academic year.`);
        }

        const nextTerm = sortedTerms[index + 1];
        if (nextTerm && rangesOverlap(term.startDate, term.endDate, nextTerm.startDate, nextTerm.endDate)) {
          throwError('VALIDATION', 'Term date ranges may not overlap.');
        }
      });

      const existingTerms = await ctx.db
        .query('terms')
        .withIndex('by_academic_year', (q) => q.eq('academicYearId', args.academicYearId))
        .collect();

      if (existingTerms.length > 0) {
        throwError('CONFLICT', 'Terms have already been created for this academic year.');
      }

      const now = Date.now();

      return Promise.all(
        sortedTerms.map((term, index) =>
          ctx.db.insert('terms', {
            schoolId: scopedSchoolId,
            academicYearId: args.academicYearId,
            name: term.name.trim(),
            startDate: term.startDate,
            endDate: term.endDate,
            isCurrent: false,
            status: index === 0 ? 'upcoming' : 'upcoming',
            createdAt: now,
            updatedAt: now,
          }),
        ),
      );
    });
  },
});

export const activateTerm = mutation({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const term = ensureBelongsToSchool(await ctx.db.get(args.termId), scopedSchoolId, 'Term');
      const school = await getSchoolOrThrow(ctx, scopedSchoolId);

      const terms = await ctx.db
        .query('terms')
        .withIndex('by_school', (q) => q.eq('schoolId', scopedSchoolId))
        .collect();

      const now = Date.now();

      await Promise.all(
        terms.map((entry) =>
          ctx.db.patch(entry._id, {
            isCurrent: entry._id === args.termId,
            status: entry._id === args.termId ? 'active' : entry.endDate < term.startDate ? 'closed' : 'upcoming',
            updatedAt: now,
          }),
        ),
      );

      await ctx.db.patch(scopedSchoolId, {
        currentTermId: args.termId,
        currentAcademicYearId: term.academicYearId,
        updatedAt: now,
      });

      await createSchoolAdminNotification(
        ctx,
        school,
        'Term activated',
        `${term.name} is now the active term for ${school.name}.`,
        '/settings/academic-year',
      );

      return { success: true };
    });
  },
});

export const updateTermDates = mutation({
  args: {
    termId: v.id('terms'),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_SETTINGS);

      const scopedSchoolId = ensureSchoolId(schoolId);
      const term = ensureBelongsToSchool(await ctx.db.get(args.termId), scopedSchoolId, 'Term');
      ensureDateRange(args.startDate, args.endDate, term.name);

      const siblingTerms = await ctx.db
        .query('terms')
        .withIndex('by_academic_year', (q) => q.eq('academicYearId', term.academicYearId))
        .collect();

      const conflict = siblingTerms.find(
        (entry) =>
          entry._id !== args.termId && rangesOverlap(args.startDate, args.endDate, entry.startDate, entry.endDate),
      );

      if (conflict) {
        throwError('CONFLICT', `The updated dates overlap with ${conflict.name}.`);
      }

      await ctx.db.patch(args.termId, {
        startDate: args.startDate,
        endDate: args.endDate,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const getTermsByYear = query({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const terms = await ctx.db
        .query('terms')
        .withIndex('by_academic_year', (q) => q.eq('academicYearId', args.academicYearId))
        .collect();

      return terms
        .filter((term) => term.schoolId === scopedSchoolId)
        .sort((a, b) => a.startDate - b.startDate);
    });
  },
});

export const getCurrentTerm = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const term = await ctx.db
        .query('terms')
        .withIndex('by_current', (q) => q.eq('schoolId', scopedSchoolId).eq('isCurrent', true))
        .unique();

      if (!term) {
        return null;
      }

      const daysRemaining = Math.max(0, Math.ceil((term.endDate - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        ...term,
        daysRemaining,
      };
    });
  },
});
