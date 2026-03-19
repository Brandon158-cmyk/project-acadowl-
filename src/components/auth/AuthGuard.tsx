'use client';

import { type ReactNode } from 'react';
import { useConvexAuth } from 'convex/react';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Blocks rendering until the user is authenticated via Convex
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const resolvedFallback = fallback ?? <PageSkeleton />;

  if (isLoading) {
    return resolvedFallback;
  }

  if (!isAuthenticated) {
    return resolvedFallback;
  }

  return <>{children}</>;
}
