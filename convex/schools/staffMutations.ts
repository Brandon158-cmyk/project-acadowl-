import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Permission, requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { throwError } from '../_lib/errors';
import { ensureSchoolId } from './_helpers';
import { nextCounterValue } from '../students/_helpers';

const StaffRole = v.union(
  v.literal('school_admin'),
  v.literal('deputy_head'),
  v.literal('bursar'),
  v.literal('teacher'),
  v.literal('class_teacher'),
  v.literal('matron'),
  v.literal('librarian'),
  v.literal('driver'),
  v.literal('support_staff'),
);

export const createStaff = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    nrcNumber: v.optional(v.string()),
    role: StaffRole,
    staffCategory: v.optional(v.union(v.literal('teaching'), v.literal('non_teaching'))),
    department: v.optional(v.string()),
    contractType: v.optional(v.union(v.literal('permanent'), v.literal('contract'), v.literal('part_time'))),
    dateJoined: v.number(),
    qualifications: v.optional(v.array(v.string())),
    eczRegistrationNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);

      // Check for duplicate email
      if (args.email) {
        const existing = await ctx.db
          .query('staff')
          .withIndex('by_email', (q) => q.eq('schoolId', scopedSchoolId).eq('email', args.email))
          .unique();
        if (existing) {
          throwError('CONFLICT', 'A staff member with this email already exists.');
        }
      }

      // Check for duplicate phone
      if (args.phone) {
        const existing = await ctx.db
          .query('staff')
          .withIndex('by_phone', (q) => q.eq('schoolId', scopedSchoolId).eq('phone', args.phone))
          .unique();
        if (existing) {
          throwError('CONFLICT', 'A staff member with this phone number already exists.');
        }
      }

      // Generate employee number
      const sequence = await nextCounterValue(ctx, scopedSchoolId, 'employee_number');
      const employeeNumber = `EMP-${String(sequence).padStart(4, '0')}`;

      const now = Date.now();
      const staffId = await ctx.db.insert('staff', {
        schoolId: scopedSchoolId,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        gender: args.gender,
        email: args.email?.trim().toLowerCase(),
        phone: args.phone?.trim(),
        nrcNumber: args.nrcNumber?.trim(),
        employeeNumber,
        role: args.role,
        staffCategory: args.staffCategory,
        department: args.department?.trim(),
        contractType: args.contractType,
        dateJoined: args.dateJoined,
        qualifications: args.qualifications,
        eczRegistrationNumber: args.eczRegistrationNumber?.trim(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return { staffId, employeeNumber };
    });
  },
});

export const updateStaff = mutation({
  args: {
    staffId: v.id('staff'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'))),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    nrcNumber: v.optional(v.string()),
    role: v.optional(StaffRole),
    staffCategory: v.optional(v.union(v.literal('teaching'), v.literal('non_teaching'))),
    department: v.optional(v.string()),
    contractType: v.optional(v.union(v.literal('permanent'), v.literal('contract'), v.literal('part_time'))),
    qualifications: v.optional(v.array(v.string())),
    eczRegistrationNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const staffRecord = await ctx.db.get(args.staffId);
      if (!staffRecord || staffRecord.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Staff record not found.');
      }

      await ctx.db.patch(args.staffId, {
        firstName: args.firstName?.trim() ?? staffRecord.firstName,
        lastName: args.lastName?.trim() ?? staffRecord.lastName,
        gender: args.gender ?? staffRecord.gender,
        email: args.email?.trim().toLowerCase() ?? staffRecord.email,
        phone: args.phone?.trim() ?? staffRecord.phone,
        nrcNumber: args.nrcNumber?.trim() ?? staffRecord.nrcNumber,
        role: args.role ?? staffRecord.role,
        staffCategory: args.staffCategory ?? staffRecord.staffCategory,
        department: args.department?.trim() ?? staffRecord.department,
        contractType: args.contractType ?? staffRecord.contractType,
        qualifications: args.qualifications ?? staffRecord.qualifications,
        eczRegistrationNumber: args.eczRegistrationNumber?.trim() ?? staffRecord.eczRegistrationNumber,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const toggleStaffStatus = mutation({
  args: { staffId: v.id('staff') },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, role }) => {
      requirePermission(role, Permission.MANAGE_STAFF);
      const scopedSchoolId = ensureSchoolId(schoolId);

      const staffRecord = await ctx.db.get(args.staffId);
      if (!staffRecord || staffRecord.schoolId !== scopedSchoolId) {
        throwError('NOT_FOUND', 'Staff record not found.');
      }

      await ctx.db.patch(args.staffId, {
        isActive: !staffRecord.isActive,
        dateLeft: staffRecord.isActive ? Date.now() : undefined,
        updatedAt: Date.now(),
      });

      return { success: true, isActive: !staffRecord.isActive };
    });
  },
});
