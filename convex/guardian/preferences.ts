import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { withSchoolScope } from '../_lib/schoolContext';
import { ensureSchoolId } from '../schools/_helpers';
import { getGuardianForUser } from './_helpers';

const notificationPreferencesValidator = v.object({
  smsEnabled: v.boolean(),
  whatsappEnabled: v.boolean(),
  pushEnabled: v.boolean(),
  emailEnabled: v.boolean(),
  attendanceAbsent: v.boolean(),
  attendanceLate: v.boolean(),
  resultsReleased: v.boolean(),
  feeInvoiceGenerated: v.boolean(),
  feeReminder: v.boolean(),
  feePaymentConfirmed: v.boolean(),
  homeworkAssigned: v.boolean(),
  newMessage: v.boolean(),
  schoolAnnouncement: v.boolean(),
  weeklyDigest: v.boolean(),
  sickBayAdmission: v.boolean(),
  visitorArrival: v.boolean(),
  pocketMoneyWithdrawal: v.boolean(),
  nightPrepAbsent: v.boolean(),
  busArriving: v.boolean(),
  studentNotBoarded: v.boolean(),
  routeDelay: v.boolean(),
});

function defaultPreferences() {
  return {
    smsEnabled: true,
    whatsappEnabled: false,
    pushEnabled: false,
    emailEnabled: false,
    attendanceAbsent: true,
    attendanceLate: true,
    resultsReleased: true,
    feeInvoiceGenerated: true,
    feeReminder: true,
    feePaymentConfirmed: true,
    homeworkAssigned: true,
    newMessage: true,
    schoolAnnouncement: true,
    weeklyDigest: true,
    sickBayAdmission: true,
    visitorArrival: true,
    pocketMoneyWithdrawal: true,
    nightPrepAbsent: true,
    busArriving: true,
    studentNotBoarded: true,
    routeDelay: true,
  };
}

export const getNotificationPreferences = query({
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);
      return guardian.notificationPreferences ?? defaultPreferences();
    });
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    preferences: notificationPreferencesValidator,
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      await ctx.db.patch(guardian._id, {
        notificationPreferences: args.preferences,
        receiveWeeklyDigest: args.preferences.weeklyDigest,
        receiveAttendanceSMS: args.preferences.attendanceAbsent || args.preferences.attendanceLate,
        receiveResultsSMS: args.preferences.resultsReleased,
        receiveFeeReminderSMS: args.preferences.feeReminder,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});

export const completeGuardianFirstLoginSetup = mutation({
  args: {
    whatsappPhone: v.optional(v.string()),
    receiveAttendanceSMS: v.boolean(),
    receiveResultsSMS: v.boolean(),
    receiveFeeReminderSMS: v.boolean(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ schoolId, userId }) => {
      const scopedSchoolId = ensureSchoolId(schoolId);
      const { guardian } = await getGuardianForUser(ctx, scopedSchoolId, userId);

      await ctx.db.patch(guardian._id, {
        whatsappPhone: args.whatsappPhone,
        receiveAttendanceSMS: args.receiveAttendanceSMS,
        receiveResultsSMS: args.receiveResultsSMS,
        receiveFeeReminderSMS: args.receiveFeeReminderSMS,
        receiveWeeklyDigest: true,
        updatedAt: Date.now(),
      });

      await ctx.db.patch(userId, {
        isFirstLogin: false,
        updatedAt: Date.now(),
      });

      return { success: true };
    });
  },
});
