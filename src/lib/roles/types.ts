// Client-side Role enum — mirrors the Convex schema Role union
export enum Role {
  PLATFORM_ADMIN = 'platform_admin',
  SCHOOL_ADMIN = 'school_admin',
  DEPUTY_HEAD = 'deputy_head',
  BURSAR = 'bursar',
  TEACHER = 'teacher',
  CLASS_TEACHER = 'class_teacher',
  MATRON = 'matron',
  LIBRARIAN = 'librarian',
  DRIVER = 'driver',
  GUARDIAN = 'guardian',
  STUDENT = 'student',
}

// Client-side Permission enum — mirrors server-side Permission
export enum Permission {
  // Platform
  MANAGE_SCHOOLS = 'MANAGE_SCHOOLS',
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',

  // School admin
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_STAFF = 'MANAGE_STAFF',
  MANAGE_STUDENTS = 'MANAGE_STUDENTS',
  MANAGE_ACADEMICS = 'MANAGE_ACADEMICS',
  MANAGE_FEES = 'MANAGE_FEES',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',

  // Teacher
  MARK_ATTENDANCE = 'MARK_ATTENDANCE',
  ENTER_GRADES = 'ENTER_GRADES',
  VIEW_CLASS = 'VIEW_CLASS',
  MANAGE_ASSIGNMENTS = 'MANAGE_ASSIGNMENTS',

  // Bursar
  PROCESS_PAYMENTS = 'PROCESS_PAYMENTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  MANAGE_FEE_STRUCTURES = 'MANAGE_FEE_STRUCTURES',

  // Matron
  MANAGE_DORMITORY = 'MANAGE_DORMITORY',
  VIEW_BOARDING_STUDENTS = 'VIEW_BOARDING_STUDENTS',

  // Librarian
  MANAGE_LIBRARY = 'MANAGE_LIBRARY',
  ISSUE_BOOKS = 'ISSUE_BOOKS',

  // Driver
  VIEW_ROUTE = 'VIEW_ROUTE',
  MARK_PICKUP_DROPOFF = 'MARK_PICKUP_DROPOFF',

  // Guardian
  VIEW_CHILD_PROGRESS = 'VIEW_CHILD_PROGRESS',
  VIEW_CHILD_FEES = 'VIEW_CHILD_FEES',
  MAKE_PAYMENT = 'MAKE_PAYMENT',

  // Student
  VIEW_OWN_GRADES = 'VIEW_OWN_GRADES',
  VIEW_OWN_TIMETABLE = 'VIEW_OWN_TIMETABLE',
  SUBMIT_ASSIGNMENTS = 'SUBMIT_ASSIGNMENTS',
}

// Role display names for UI
export const ROLE_LABELS: Record<Role, string> = {
  [Role.PLATFORM_ADMIN]: 'Platform Admin',
  [Role.SCHOOL_ADMIN]: 'School Admin',
  [Role.DEPUTY_HEAD]: 'Deputy Head',
  [Role.BURSAR]: 'Bursar',
  [Role.TEACHER]: 'Teacher',
  [Role.CLASS_TEACHER]: 'Class Teacher',
  [Role.MATRON]: 'Matron',
  [Role.LIBRARIAN]: 'Librarian',
  [Role.DRIVER]: 'Driver',
  [Role.GUARDIAN]: 'Parent/Guardian',
  [Role.STUDENT]: 'Student',
};

// Role to default dashboard path mapping
export const ROLE_DASHBOARDS: Record<Role, string> = {
  [Role.PLATFORM_ADMIN]: '/schools',
  [Role.SCHOOL_ADMIN]: '/dashboard',
  [Role.DEPUTY_HEAD]: '/dashboard',
  [Role.BURSAR]: '/dashboard',
  [Role.TEACHER]: '/dashboard',
  [Role.CLASS_TEACHER]: '/dashboard',
  [Role.MATRON]: '/dashboard',
  [Role.LIBRARIAN]: '/dashboard',
  [Role.DRIVER]: '/route',
  [Role.GUARDIAN]: '/dashboard',
  [Role.STUDENT]: '/dashboard',
};
