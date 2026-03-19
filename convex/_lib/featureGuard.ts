import { ConvexError } from 'convex/values';
import type { Doc } from '../_generated/dataModel';

// Server-side feature flag check
// Throws if the school does not have the required feature enabled
export function requireFeature(
  school: Doc<'schools'>,
  feature: string,
): void {
  if (!school.enabledFeatures.includes(feature as Doc<'schools'>['enabledFeatures'][number])) {
    throw new ConvexError(
      `FORBIDDEN: Feature "${feature}" is not enabled for this school`,
    );
  }
}

// Check if a school has a feature enabled (non-throwing)
export function hasFeature(
  school: Doc<'schools'>,
  feature: string,
): boolean {
  return school.enabledFeatures.includes(feature as Doc<'schools'>['enabledFeatures'][number]);
}
