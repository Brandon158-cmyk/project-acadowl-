import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { throwError } from '../_lib/errors';
import { getGuardianForUser } from './_helpers';

export const updateGuardianProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    whatsappPhone: v.optional(v.string()),
    occupation: v.optional(v.string()),
    employer: v.optional(v.string()),
    address: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      const now = Date.now();
      await ctx.db.patch(guardian._id, {
        firstName: args.firstName?.trim() ?? guardian.firstName,
        lastName: args.lastName?.trim() ?? guardian.lastName,
        email: args.email?.trim().toLowerCase() ?? guardian.email,
        whatsappPhone: args.whatsappPhone?.trim() ?? guardian.whatsappPhone,
        occupation: args.occupation?.trim() ?? guardian.occupation,
        employer: args.employer?.trim() ?? guardian.employer,
        address: args.address?.trim() ?? guardian.address,
        updatedAt: now,
      });

      if (args.photoUrl) {
        const user = guardian.userId ? await ctx.db.get(guardian.userId) : null;
        if (user) {
          await ctx.db.patch(user._id, {
            avatarUrl: args.photoUrl,
            updatedAt: now,
          });
        }
      }

      return { success: true };
    });
  },
});

export const requestPhoneNumberChange = mutation({
  args: {
    requestedValue: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      if (!args.requestedValue.trim()) {
        throwError('VALIDATION', 'Requested phone number is required.');
      }

      const requestId = await ctx.db.insert('profileChangeRequests', {
        schoolId: scopedSchoolId,
        guardianId: guardian._id,
        changeType: 'phone_number',
        currentValue: guardian.phone,
        requestedValue: args.requestedValue.trim(),
        reason: args.reason.trim(),
        status: 'pending',
        createdAt: Date.now(),
      });

      return { requestId };
    });
  },
});
