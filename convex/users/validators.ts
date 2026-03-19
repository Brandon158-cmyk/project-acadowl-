import { v } from 'convex/values';
import { Role } from '../schema';

// Shared validators for user-related operations
export const userIdValidator = v.id('users');
export const roleValidator = Role;
export const notifPrefsValidator = v.object({
  sms: v.boolean(),
  whatsapp: v.boolean(),
  email: v.boolean(),
  inApp: v.boolean(),
});
