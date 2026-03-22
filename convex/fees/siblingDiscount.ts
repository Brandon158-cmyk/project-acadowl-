import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { withSchoolScope } from '../_lib/schoolContext';
import { getPrimaryGuardianId } from './_helpers';

// Pure function: calculate sibling discount for a given child index
export function calculateSiblingDiscount(
  childIndex: number,
  rules: Array<{ childIndex: number; discountPercent: number; applyToFeeTypes?: string[] }>,
): { discountPercent: number; applyToFeeTypes: string[] } {
  const rule = rules.find((r) => r.childIndex === childIndex);
  if (!rule) {
    return { discountPercent: 0, applyToFeeTypes: [] };
  }
  return {
    discountPercent: rule.discountPercent,
    applyToFeeTypes: rule.applyToFeeTypes ?? [],
  };
}

// Query: get all active children for a guardian in a given term
export const getGuardianChildrenForTerm = query({
  args: {
    guardianId: v.id('guardians'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      const allStudents = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
        .collect();

      // Filter to students linked to this guardian
      const students = allStudents.filter((s) => {
        const links = s.guardianLinks ?? [];
        return links.some((l) => l.guardianId === args.guardianId);
      });

      // Sort by enrollment date (earliest first = child index 0)
      const sorted = students.sort(
        (a, b) => (a.enrolledAt ?? 0) - (b.enrolledAt ?? 0),
      );

      // Load school for discount rules
      const school = await ctx.db.get(schoolId);
      const rules = school?.siblingDiscountRules ?? [];

      return sorted.map((student, index) => {
        const discount = calculateSiblingDiscount(index, rules);

        return {
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          gradeId: student.currentGradeId,
          boardingStatus: student.boardingStatus ?? 'day',
          childIndex: index,
          discountPercent: discount.discountPercent,
        };
      });
    });
  },
});

// Query: get sibling groups for the whole school (admin view)
export const getSiblingGroups = query({
  args: {
    termId: v.optional(v.id('terms')),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];

      // Get all active students with guardians
      const students = await ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .filter((q) => q.eq(q.field('enrollmentStatus'), 'active'))
        .collect();

      // Group by primary guardianId
      const guardianMap = new Map<
        string,
        Array<{
          studentId: string;
          firstName: string;
          lastName: string;
          enrolledAt: number;
          boardingStatus: string;
        }>
      >();

      for (const student of students) {
        const gId = getPrimaryGuardianId(student);
        if (!gId) continue;
        const gIdStr = gId as string;
        if (!guardianMap.has(gIdStr)) {
          guardianMap.set(gIdStr, []);
        }
        guardianMap.get(gIdStr)!.push({
          studentId: student._id as string,
          firstName: student.firstName,
          lastName: student.lastName,
          enrolledAt: student.enrolledAt ?? 0,
          boardingStatus: student.boardingStatus ?? 'day',
        });
      }

      // Only return groups with 2+ children (actual sibling groups)
      const school = await ctx.db.get(schoolId);
      const rules = school?.siblingDiscountRules ?? [];

      const groups: Array<{
        guardianId: string;
        guardianName: string;
        children: Array<{
          studentId: string;
          studentName: string;
          gradeName: string;
          rank: number;
          discountPercent: number;
        }>;
        totalExpectedFees: number;
        totalDiscount: number;
      }> = [];

      for (const [guardianId, children] of guardianMap) {
        if (children.length < 2) continue;

        const guardian = await ctx.db.get(guardianId as any);
        const guardianName = guardian
          ? `${(guardian as any).firstName} ${(guardian as any).lastName}`
          : 'Unknown';

        const sortedChildren = children.sort(
          (a, b) => a.enrolledAt - b.enrolledAt,
        );

        // Calculate fees for each child
        let groupTotalFees = 0;
        let groupTotalDiscount = 0;

        const childrenWithDetails = await Promise.all(
          sortedChildren.map(async (child, index) => {
            const discount = calculateSiblingDiscount(index, rules);

            // Get grade name
            const studentDoc = await ctx.db.get(child.studentId as Id<'students'>);
            const grade = studentDoc?.currentGradeId
              ? await ctx.db.get(studentDoc.currentGradeId)
              : null;
            const gradeName = grade?.name ?? 'Unknown';

            // Calculate expected fees for this child
            // Note: Actual fees come from feeStructures table, not grade
            // For estimation purposes, we query the fee structure for this grade
            let baseFee = 0;
            if (args.termId) {
              const termId = args.termId;
              const feeStructure = await ctx.db
                .query('feeStructures')
                .withIndex('by_term_grade', q => 
                  q.eq('schoolId', schoolId).eq('termId', termId)
                )
                .filter(q => q.eq(q.field('gradeId'), studentDoc?.currentGradeId))
                .first();
              baseFee = feeStructure?.amountZMW ?? 0;
            }
            groupTotalFees += baseFee;
            groupTotalDiscount += baseFee * (discount.discountPercent / 100);

            return {
              studentId: child.studentId,
              studentName: `${child.firstName} ${child.lastName}`,
              gradeName,
              rank: index + 1,
              discountPercent: discount.discountPercent,
            };
          }),
        );

        groups.push({
          guardianId,
          guardianName,
          children: childrenWithDetails,
          totalExpectedFees: groupTotalFees,
          totalDiscount: groupTotalDiscount,
        });
      }

      return groups;
    });
  },
});
