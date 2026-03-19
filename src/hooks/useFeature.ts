'use client';

import { useSchool } from './useSchool';
import { Feature } from '@/lib/features/flags';

// Check if a feature is enabled for the current school
export function useFeature(feature: Feature): boolean {
  const { school } = useSchool();
  if (!school) return false;
  return school.enabledFeatures.includes(feature);
}

// Check multiple features at once
export function useFeatures(features: Feature[]): Record<Feature, boolean> {
  const { school } = useSchool();
  const result = {} as Record<Feature, boolean>;
  for (const f of features) {
    result[f] = school?.enabledFeatures.includes(f) ?? false;
  }
  return result;
}
