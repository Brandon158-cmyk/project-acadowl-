import { query } from './_generated/server';
import { withSchoolScope } from './_lib/schoolContext';

// Top-level re-export so frontend can use api.terms.getActiveTerms
export const getActiveTerms = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const terms = await ctx.db
        .query('terms')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      return terms.sort((a, b) => a.startDate - b.startDate);
    });
  },
});
