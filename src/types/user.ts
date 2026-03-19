import type { Doc, Id } from '@/../convex/_generated/dataModel';

// Re-export Convex user types for convenience
export type User = Doc<'users'>;
export type UserId = Id<'users'>;

export type UserRole =
  | 'platform_admin'
  | 'school_admin'
  | 'deputy_head'
  | 'bursar'
  | 'teacher'
  | 'class_teacher'
  | 'matron'
  | 'librarian'
  | 'driver'
  | 'guardian'
  | 'student';

export interface NotifPrefs {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  inApp: boolean;
}
