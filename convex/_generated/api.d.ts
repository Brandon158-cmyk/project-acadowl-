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
import type * as attendance_mutations from "../attendance/mutations.js";
import type * as attendance_queries from "../attendance/queries.js";
import type * as notifications from "../notifications.js";
import type * as notificationsAbsenceAlerts from "../notificationsAbsenceAlerts.js";
import type * as notificationsBroadcast from "../notificationsBroadcast.js";
import type * as notificationsSms from "../notificationsSms.js";
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
import type * as students__helpers from "../students/_helpers.js";
import type * as students_mutations from "../students/mutations.js";
import type * as students_portal from "../students/portal.js";
import type * as students_queries from "../students/queries.js";
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
  "attendance/mutations": typeof attendance_mutations;
  "attendance/queries": typeof attendance_queries;
  notifications: typeof notifications;
  notificationsAbsenceAlerts: typeof notificationsAbsenceAlerts;
  notificationsBroadcast: typeof notificationsBroadcast;
  notificationsSms: typeof notificationsSms;
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
  "students/_helpers": typeof students__helpers;
  "students/mutations": typeof students_mutations;
  "students/portal": typeof students_portal;
  "students/queries": typeof students_queries;
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
