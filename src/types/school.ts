import type { Doc, Id } from '@/../convex/_generated/dataModel';

// Re-export Convex school types for convenience
export type School = Doc<'schools'>;
export type SchoolId = Id<'schools'>;

export type SchoolType =
  | 'primary_day'
  | 'primary_boarding'
  | 'secondary_day'
  | 'secondary_boarding'
  | 'mixed_secondary'
  | 'combined'
  | 'college';

export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'premium';

export type GradingMode = 'ecz' | 'gpa' | 'custom';
export type AcademicMode = 'term' | 'semester';

// School type display names
export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  primary_day: 'Primary Day School',
  primary_boarding: 'Primary Boarding School',
  secondary_day: 'Secondary Day School',
  secondary_boarding: 'Secondary Boarding School',
  mixed_secondary: 'Mixed Secondary School',
  combined: 'Combined School',
  college: 'College / HEI',
};
