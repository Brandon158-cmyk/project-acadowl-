import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { requirePermission, Permission } from '../_lib/permissions';

export const getFeeTypes = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      const school = await ctx.db.get(schoolId);
      if (!school) return [];
      return (school.feeTypes ?? []).filter((ft) => ft.isActive);
    });
  },
});

export const getAllFeeTypes = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId }) => {
      if (!schoolId) return [];
      const school = await ctx.db.get(schoolId);
      if (!school) return [];
      return school.feeTypes ?? [];
    });
  },
});

export const addFeeType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isRecurring: v.boolean(),
    isOptional: v.boolean(),
    appliesToBoarding: v.union(
      v.literal('day_only'),
      v.literal('boarding_only'),
      v.literal('all'),
    ),
    zraLevyCode: v.optional(v.string()),
    zraVatCategory: v.union(
      v.literal('exempt'),
      v.literal('standard'),
      v.literal('zero_rated'),
      v.literal('levy'),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existingTypes = school.feeTypes ?? [];

      const id = crypto.randomUUID();
      const order = existingTypes.length;

      const newFeeType = {
        id,
        name: args.name,
        description: args.description,
        isRecurring: args.isRecurring,
        isOptional: args.isOptional,
        appliesToBoarding: args.appliesToBoarding,
        zraLevyCode: args.zraLevyCode,
        zraVatCategory: args.zraVatCategory,
        isActive: true,
        order,
      };

      await ctx.db.patch(schoolId, {
        feeTypes: [...existingTypes, newFeeType],
        updatedAt: Date.now(),
      });

      return id;
    });
  },
});

export const updateFeeType = mutation({
  args: {
    feeTypeId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    isOptional: v.optional(v.boolean()),
    appliesToBoarding: v.optional(
      v.union(
        v.literal('day_only'),
        v.literal('boarding_only'),
        v.literal('all'),
      ),
    ),
    zraLevyCode: v.optional(v.string()),
    zraVatCategory: v.optional(
      v.union(
        v.literal('exempt'),
        v.literal('standard'),
        v.literal('zero_rated'),
        v.literal('levy'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existingTypes = school.feeTypes ?? [];
      const idx = existingTypes.findIndex((ft) => ft.id === args.feeTypeId);
      if (idx === -1) throw new Error('Fee type not found');

      const updated = [...existingTypes];
      updated[idx] = {
        ...updated[idx],
        ...(args.name !== undefined && { name: args.name }),
        ...(args.description !== undefined && { description: args.description }),
        ...(args.isRecurring !== undefined && { isRecurring: args.isRecurring }),
        ...(args.isOptional !== undefined && { isOptional: args.isOptional }),
        ...(args.appliesToBoarding !== undefined && { appliesToBoarding: args.appliesToBoarding }),
        ...(args.zraLevyCode !== undefined && { zraLevyCode: args.zraLevyCode }),
        ...(args.zraVatCategory !== undefined && { zraVatCategory: args.zraVatCategory }),
      };

      await ctx.db.patch(schoolId, {
        feeTypes: updated,
        updatedAt: Date.now(),
      });
    });
  },
});

export const deactivateFeeType = mutation({
  args: {
    feeTypeId: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existingTypes = school.feeTypes ?? [];
      const idx = existingTypes.findIndex((ft) => ft.id === args.feeTypeId);
      if (idx === -1) throw new Error('Fee type not found');

      const updated = [...existingTypes];
      updated[idx] = { ...updated[idx], isActive: false };

      await ctx.db.patch(schoolId, {
        feeTypes: updated,
        updatedAt: Date.now(),
      });
    });
  },
});

export const reorderFeeTypes = mutation({
  args: {
    orderedIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existingTypes = school.feeTypes ?? [];
      const updated = existingTypes.map((ft) => ({
        ...ft,
        order: args.orderedIds.indexOf(ft.id),
      }));

      await ctx.db.patch(schoolId, {
        feeTypes: updated,
        updatedAt: Date.now(),
      });
    });
  },
});

export const seedDefaultFeeTypes = mutation({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_FEE_STRUCTURE);
      if (!schoolId) throw new Error('School context required');

      const school = await ctx.db.get(schoolId);
      if (!school) throw new Error('School not found');

      const existingTypes = school.feeTypes ?? [];
      if (existingTypes.length > 0) {
        throw new Error('Fee types already exist. Seed is only allowed on empty fee type list.');
      }

      const defaults = [
        {
          id: crypto.randomUUID(),
          name: 'Tuition',
          description: 'Recurring term tuition fee',
          isRecurring: true,
          isOptional: false,
          appliesToBoarding: 'all' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 0,
        },
        {
          id: crypto.randomUUID(),
          name: 'Development Levy',
          description: 'Recurring infrastructure development levy',
          isRecurring: true,
          isOptional: false,
          appliesToBoarding: 'all' as const,
          zraVatCategory: 'levy' as const,
          isActive: true,
          order: 1,
        },
        {
          id: crypto.randomUUID(),
          name: 'Boarding Fee',
          description: 'Term boarding accommodation fee',
          isRecurring: true,
          isOptional: false,
          appliesToBoarding: 'boarding_only' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 2,
        },
        {
          id: crypto.randomUUID(),
          name: 'Meals',
          description: 'Boarding student meals',
          isRecurring: true,
          isOptional: false,
          appliesToBoarding: 'boarding_only' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 3,
        },
        {
          id: crypto.randomUUID(),
          name: 'Registration Fee',
          description: 'One-off fee charged at enrolment',
          isRecurring: false,
          isOptional: false,
          appliesToBoarding: 'all' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 4,
        },
        {
          id: crypto.randomUUID(),
          name: 'PTA Contribution',
          description: 'Optional Parent-Teacher Association contribution',
          isRecurring: true,
          isOptional: true,
          appliesToBoarding: 'all' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 5,
        },
        {
          id: crypto.randomUUID(),
          name: 'Examination Fee',
          description: 'One-off examination fee',
          isRecurring: false,
          isOptional: false,
          appliesToBoarding: 'all' as const,
          zraVatCategory: 'exempt' as const,
          isActive: true,
          order: 6,
        },
      ];

      await ctx.db.patch(schoolId, {
        feeTypes: defaults,
        updatedAt: Date.now(),
      });
    });
  },
});
