import { query } from './_generated/server';
import { withSchoolScope } from './_lib/schoolContext';

// Top-level re-export so frontend can use api.grades.getGrades
export const getGrades = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const grades = await ctx.db
        .query('grades')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      return grades.sort((a, b) => a.level - b.level);
    });
  },
});
