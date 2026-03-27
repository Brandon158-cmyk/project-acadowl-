/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_errors from "../_lib/errors.js";
import type * as _lib_featureGuard from "../_lib/featureGuard.js";
import type * as _lib_permissions from "../_lib/permissions.js";
import type * as _lib_schoolContext from "../_lib/schoolContext.js";
import type * as _seed_data from "../_seed/data.js";
import type * as analytics from "../analytics.js";
import type * as announcements_mutations from "../announcements/mutations.js";
import type * as attendance_mutations from "../attendance/mutations.js";
import type * as attendance_queries from "../attendance/queries.js";
import type * as crons from "../crons.js";
import type * as fees__helpers from "../fees/_helpers.js";
import type * as fees_analytics from "../fees/analytics.js";
import type * as fees_arrears from "../fees/arrears.js";
import type * as fees_arrearsPolicy from "../fees/arrearsPolicy.js";
import type * as fees_auditLog from "../fees/auditLog.js";
import type * as fees_bankReconciliation from "../fees/bankReconciliation.js";
import type * as fees_bulkInvoice from "../fees/bulkInvoice.js";
import type * as fees_cashbook from "../fees/cashbook.js";
import type * as fees_clearance from "../fees/clearance.js";
import type * as fees_consolidatedInvoice from "../fees/consolidatedInvoice.js";
import type * as fees_creditNotes from "../fees/creditNotes.js";
import type * as fees_dashboardStats from "../fees/dashboardStats.js";
import type * as fees_feeTypes from "../fees/feeTypes.js";
import type * as fees_instalments from "../fees/instalments.js";
import type * as fees_invoiceGenerator from "../fees/invoiceGenerator.js";
import type * as fees_invoices from "../fees/invoices.js";
import type * as fees_ledger from "../fees/ledger.js";
import type * as fees_mobileMoneyConfig from "../fees/mobileMoneyConfig.js";
import type * as fees_payments from "../fees/payments.js";
import type * as fees_proration from "../fees/proration.js";
import type * as fees_registrationFee from "../fees/registrationFee.js";
import type * as fees_reports from "../fees/reports.js";
import type * as fees_scholarships from "../fees/scholarships.js";
import type * as fees_siblingDiscount from "../fees/siblingDiscount.js";
import type * as fees_structures from "../fees/structures.js";
import type * as fees_unallocatedPayments from "../fees/unallocatedPayments.js";
import type * as fees_webhooks from "../fees/webhooks.js";
import type * as fees_zra from "../fees/zra.js";
import type * as grades from "../grades.js";
import type * as guardian__helpers from "../guardian/_helpers.js";
import type * as guardian_activation from "../guardian/activation.js";
import type * as guardian_announcements from "../guardian/announcements.js";
import type * as guardian_attendance from "../guardian/attendance.js";
import type * as guardian_dashboard from "../guardian/dashboard.js";
import type * as guardian_fees from "../guardian/fees.js";
import type * as guardian_notifications from "../guardian/notifications.js";
import type * as guardian_preferences from "../guardian/preferences.js";
import type * as guardian_profile from "../guardian/profile.js";
import type * as guardian_results from "../guardian/results.js";
import type * as guardian_weeklyDigest from "../guardian/weeklyDigest.js";
import type * as messaging_queries from "../messaging/queries.js";
import type * as messaging_threads from "../messaging/threads.js";
import type * as notifications from "../notifications.js";
import type * as notificationsAbsenceAlerts from "../notificationsAbsenceAlerts.js";
import type * as notificationsBroadcast from "../notificationsBroadcast.js";
import type * as notificationsPush from "../notificationsPush.js";
import type * as notificationsSms from "../notificationsSms.js";
import type * as notificationsWhatsapp from "../notificationsWhatsapp.js";
import type * as schools__helpers from "../schools/_helpers.js";
import type * as schools_academicYears from "../schools/academicYears.js";
import type * as schools_assignments from "../schools/assignments.js";
import type * as schools_dashboardQueries from "../schools/dashboardQueries.js";
import type * as schools_events from "../schools/events.js";
import type * as schools_examMutations from "../schools/examMutations.js";
import type * as schools_examQueries from "../schools/examQueries.js";
import type * as schools_grades from "../schools/grades.js";
import type * as schools_mutations from "../schools/mutations.js";
import type * as schools_queries from "../schools/queries.js";
import type * as schools_sectionTransfers from "../schools/sectionTransfers.js";
import type * as schools_sections from "../schools/sections.js";
import type * as schools_staffMutations from "../schools/staffMutations.js";
import type * as schools_staffQueries from "../schools/staffQueries.js";
import type * as schools_subjects from "../schools/subjects.js";
import type * as schools_teacher from "../schools/teacher.js";
import type * as schools_terms from "../schools/terms.js";
import type * as schools_timetable from "../schools/timetable.js";
import type * as schools_validators from "../schools/validators.js";
import type * as seed from "../seed.js";
import type * as seedComprehensive from "../seedComprehensive.js";
import type * as seedDev from "../seedDev.js";
import type * as students__helpers from "../students/_helpers.js";
import type * as students_mutations from "../students/mutations.js";
import type * as students_portal from "../students/portal.js";
import type * as students_queries from "../students/queries.js";
import type * as terms from "../terms.js";
import type * as users_actions from "../users/actions.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_validators from "../users/validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/errors": typeof _lib_errors;
  "_lib/featureGuard": typeof _lib_featureGuard;
  "_lib/permissions": typeof _lib_permissions;
  "_lib/schoolContext": typeof _lib_schoolContext;
  "_seed/data": typeof _seed_data;
  analytics: typeof analytics;
  "announcements/mutations": typeof announcements_mutations;
  "attendance/mutations": typeof attendance_mutations;
  "attendance/queries": typeof attendance_queries;
  crons: typeof crons;
  "fees/_helpers": typeof fees__helpers;
  "fees/analytics": typeof fees_analytics;
  "fees/arrears": typeof fees_arrears;
  "fees/arrearsPolicy": typeof fees_arrearsPolicy;
  "fees/auditLog": typeof fees_auditLog;
  "fees/bankReconciliation": typeof fees_bankReconciliation;
  "fees/bulkInvoice": typeof fees_bulkInvoice;
  "fees/cashbook": typeof fees_cashbook;
  "fees/clearance": typeof fees_clearance;
  "fees/consolidatedInvoice": typeof fees_consolidatedInvoice;
  "fees/creditNotes": typeof fees_creditNotes;
  "fees/dashboardStats": typeof fees_dashboardStats;
  "fees/feeTypes": typeof fees_feeTypes;
  "fees/instalments": typeof fees_instalments;
  "fees/invoiceGenerator": typeof fees_invoiceGenerator;
  "fees/invoices": typeof fees_invoices;
  "fees/ledger": typeof fees_ledger;
  "fees/mobileMoneyConfig": typeof fees_mobileMoneyConfig;
  "fees/payments": typeof fees_payments;
  "fees/proration": typeof fees_proration;
  "fees/registrationFee": typeof fees_registrationFee;
  "fees/reports": typeof fees_reports;
  "fees/scholarships": typeof fees_scholarships;
  "fees/siblingDiscount": typeof fees_siblingDiscount;
  "fees/structures": typeof fees_structures;
  "fees/unallocatedPayments": typeof fees_unallocatedPayments;
  "fees/webhooks": typeof fees_webhooks;
  "fees/zra": typeof fees_zra;
  grades: typeof grades;
  "guardian/_helpers": typeof guardian__helpers;
  "guardian/activation": typeof guardian_activation;
  "guardian/announcements": typeof guardian_announcements;
  "guardian/attendance": typeof guardian_attendance;
  "guardian/dashboard": typeof guardian_dashboard;
  "guardian/fees": typeof guardian_fees;
  "guardian/notifications": typeof guardian_notifications;
  "guardian/preferences": typeof guardian_preferences;
  "guardian/profile": typeof guardian_profile;
  "guardian/results": typeof guardian_results;
  "guardian/weeklyDigest": typeof guardian_weeklyDigest;
  "messaging/queries": typeof messaging_queries;
  "messaging/threads": typeof messaging_threads;
  notifications: typeof notifications;
  notificationsAbsenceAlerts: typeof notificationsAbsenceAlerts;
  notificationsBroadcast: typeof notificationsBroadcast;
  notificationsPush: typeof notificationsPush;
  notificationsSms: typeof notificationsSms;
  notificationsWhatsapp: typeof notificationsWhatsapp;
  "schools/_helpers": typeof schools__helpers;
  "schools/academicYears": typeof schools_academicYears;
  "schools/assignments": typeof schools_assignments;
  "schools/dashboardQueries": typeof schools_dashboardQueries;
  "schools/events": typeof schools_events;
  "schools/examMutations": typeof schools_examMutations;
  "schools/examQueries": typeof schools_examQueries;
  "schools/grades": typeof schools_grades;
  "schools/mutations": typeof schools_mutations;
  "schools/queries": typeof schools_queries;
  "schools/sectionTransfers": typeof schools_sectionTransfers;
  "schools/sections": typeof schools_sections;
  "schools/staffMutations": typeof schools_staffMutations;
  "schools/staffQueries": typeof schools_staffQueries;
  "schools/subjects": typeof schools_subjects;
  "schools/teacher": typeof schools_teacher;
  "schools/terms": typeof schools_terms;
  "schools/timetable": typeof schools_timetable;
  "schools/validators": typeof schools_validators;
  seed: typeof seed;
  seedComprehensive: typeof seedComprehensive;
  seedDev: typeof seedDev;
  "students/_helpers": typeof students__helpers;
  "students/mutations": typeof students_mutations;
  "students/portal": typeof students_portal;
  "students/queries": typeof students_queries;
  terms: typeof terms;
  "users/actions": typeof users_actions;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/validators": typeof users_validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
