import { Permission, Role } from './types';

// Role → Permission matrix
// Never compare roles directly in business logic — always use canDo()
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.PLATFORM_ADMIN]: [
    Permission.MANAGE_SCHOOLS,
    Permission.MANAGE_PLATFORM,
  ],
  [Role.SCHOOL_ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_STAFF,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_ACADEMICS,
    Permission.MANAGE_FEES,
    Permission.MANAGE_SETTINGS,
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.MANAGE_FEE_STRUCTURES,
  ],
  [Role.DEPUTY_HEAD]: [
    Permission.MANAGE_STAFF,
    Permission.MANAGE_STUDENTS,
    Permission.MANAGE_ACADEMICS,
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
  ],
  [Role.BURSAR]: [
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.MANAGE_FEE_STRUCTURES,
    Permission.VIEW_CHILD_FEES,
  ],
  [Role.TEACHER]: [
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
  ],
  [Role.CLASS_TEACHER]: [
    Permission.MARK_ATTENDANCE,
    Permission.ENTER_GRADES,
    Permission.VIEW_CLASS,
    Permission.MANAGE_ASSIGNMENTS,
    Permission.MANAGE_STUDENTS,
  ],
  [Role.MATRON]: [
    Permission.MANAGE_DORMITORY,
    Permission.VIEW_BOARDING_STUDENTS,
    Permission.MARK_ATTENDANCE,
  ],
  [Role.LIBRARIAN]: [
    Permission.MANAGE_LIBRARY,
    Permission.ISSUE_BOOKS,
  ],
  [Role.DRIVER]: [
    Permission.VIEW_ROUTE,
    Permission.MARK_PICKUP_DROPOFF,
  ],
  [Role.GUARDIAN]: [
    Permission.VIEW_CHILD_PROGRESS,
    Permission.VIEW_CHILD_FEES,
    Permission.MAKE_PAYMENT,
  ],
  [Role.STUDENT]: [
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_OWN_TIMETABLE,
    Permission.SUBMIT_ASSIGNMENTS,
  ],
};

// Check if a role has a specific permission (client-side)
export function canDo(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
