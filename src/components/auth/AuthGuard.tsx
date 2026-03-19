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

  if (isLoading) {
    return fallback ?? <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
