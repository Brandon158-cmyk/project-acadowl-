import { ConvexError } from 'convex/values';

// Permission definitions for all actions in the system
export enum Permission {
  // Platform level
  MANAGE_SCHOOLS = 'MANAGE_SCHOOLS',
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',

  // School admin level
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_STAFF = 'MANAGE_STAFF',
  MANAGE_STUDENTS = 'MANAGE_STUDENTS',
  MANAGE_ACADEMICS = 'MANAGE_ACADEMICS',
  MANAGE_FEES = 'MANAGE_FEES',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  SEND_BULK_SMS = 'SEND_BULK_SMS',

  // Teacher level
  MARK_ATTENDANCE = 'MARK_ATTENDANCE',
  ENTER_GRADES = 'ENTER_GRADES',
  VIEW_CLASS = 'VIEW_CLASS',
  MANAGE_ASSIGNMENTS = 'MANAGE_ASSIGNMENTS',

  // Bursar level
  PROCESS_PAYMENTS = 'PROCESS_PAYMENTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  MANAGE_FEE_STRUCTURES = 'MANAGE_FEE_STRUCTURES',
  CREATE_INVOICE = 'CREATE_INVOICE',
  VOID_INVOICE = 'VOID_INVOICE',
  RECORD_PAYMENT = 'RECORD_PAYMENT',
  MANAGE_FEE_STRUCTURE = 'MANAGE_FEE_STRUCTURE',
  VIEW_ARREARS = 'VIEW_ARREARS',
  MANAGE_CREDIT_NOTES = 'MANAGE_CREDIT_NOTES',
  MANAGE_SCHOLARSHIPS = 'MANAGE_SCHOLARSHIPS',

  // Matron level
  MANAGE_DORMITORY = 'MANAGE_DORMITORY',
  VIEW_BOARDING_STUDENTS = 'VIEW_BOARDING_STUDENTS',

  // Librarian level
  MANAGE_LIBRARY = 'MANAGE_LIBRARY',
  ISSUE_BOOKS = 'ISSUE_BOOKS',

  // Driver level
  VIEW_ROUTE = 'VIEW_ROUTE',
  MARK_PICKUP_DROPOFF = 'MARK_PICKUP_DROPOFF',

  // Guardian level
  VIEW_CHILD_PROGRESS = 'VIEW_CHILD_PROGRESS',
  VIEW_CHILD_FEES = 'VIEW_CHILD_FEES',
  MAKE_PAYMENT = 'MAKE_PAYMENT',

  // Student level
  VIEW_OWN_GRADES = 'VIEW_OWN_GRADES',
  VIEW_OWN_TIMETABLE = 'VIEW_OWN_TIMETABLE',
  SUBMIT_ASSIGNMENTS = 'SUBMIT_ASSIGNMENTS',
}

// Role to Permission mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  platform_admin: [
    Permission.MANAGE_SCHOOLS,
    Permission.MANAGE_PLATFORM,
  ],
  school_admin: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_ACADEMICS,
    Permission.MANAGE_FEES,
    Permission.MANAGE_SETTINGS,
    Permission.SEND_BULK_SMS,
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.MANAGE_FEE_STRUCTURES,
    Permission.CREATE_INVOICE,
    Permission.VOID_INVOICE,
    Permission.RECORD_PAYMENT,
    Permission.MANAGE_FEE_STRUCTURE,
    Permission.VIEW_ARREARS,
    Permission.MANAGE_CREDIT_NOTES,
    Permission.MANAGE_SCHOLARSHIPS,
  ],
  deputy_head: [
    Permission.MANAGE_STAFF,
    Permission.MANAGE_ACADEMICS,
    Permission.SEND_BULK_SMS,
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
  ],
  bursar: [
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.MANAGE_FEE_STRUCTURES,
    Permission.VIEW_CHILD_FEES,
    Permission.CREATE_INVOICE,
    Permission.VOID_INVOICE,
    Permission.RECORD_PAYMENT,
    Permission.MANAGE_FEE_STRUCTURE,
    Permission.VIEW_ARREARS,
    Permission.MANAGE_CREDIT_NOTES,
    Permission.MANAGE_SCHOLARSHIPS,
  ],
  teacher: [
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
  ],
  class_teacher: [
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
    Permission.MANAGE_STUDENTS,
  ],
  matron: [
    Permission.MANAGE_DORMITORY,
    Permission.VIEW_BOARDING_STUDENTS,
    Permission.MARK_ATTENDANCE,
  ],
  librarian: [
    Permission.MANAGE_LIBRARY,
    Permission.ISSUE_BOOKS,
  ],
  driver: [
    Permission.VIEW_ROUTE,
    Permission.MARK_PICKUP_DROPOFF,
  ],
  guardian: [
    Permission.VIEW_CHILD_PROGRESS,
    Permission.VIEW_CHILD_FEES,
    Permission.MAKE_PAYMENT,
  ],
  student: [
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_OWN_TIMETABLE,
    Permission.SUBMIT_ASSIGNMENTS,
  ],
};

// Check if a role has a specific permission
export function canDo(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// Server-side permission check - throws if permission not granted
export function requirePermission(role: string, permission: Permission): void {
  if (!canDo(role, permission)) {
    throw new ConvexError('FORBIDDEN: Missing permission ' + permission);
  }
}

// Server-side role check
export function requireRole(role: string, requiredRole: string | string[]): void {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!roles.includes(role)) {
    throw new ConvexError('FORBIDDEN: Required role ' + roles.join(' or '));
  }
}
