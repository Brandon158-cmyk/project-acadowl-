'use client';

import { type ReactNode } from 'react';
import { useFeature } from '@/hooks/useFeature';
import { Feature } from '@/lib/features/flags';

interface FeatureGuardProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
}

// Only renders children if the feature is enabled for the current school
export function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const isEnabled = useFeature(feature);

  if (!isEnabled) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
