import { ConvexError } from 'convex/values';

// Error codes for standardized error handling
export const ErrorCodes = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  INTERNAL: 'INTERNAL',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  SCHOOL_INACTIVE: 'SCHOOL_INACTIVE',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  SMS_BALANCE_LOW: 'SMS_BALANCE_LOW',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// Helper to throw standardized errors
export function throwError(code: ErrorCode, message: string): never {
  throw new ConvexError(`${code}: ${message}`);
}
