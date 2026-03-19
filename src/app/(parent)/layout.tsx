'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ParentShell } from '@/components/layout/ParentShell';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMe } from '@/hooks/useMe';
import { SchoolProvider } from '@/providers/SchoolProvider';

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useMe();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!user?.school?.slug) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <SchoolProvider slug={user.school.slug}>
        <ParentShell>{children}</ParentShell>
      </SchoolProvider>
    </AuthGuard>
  );
}
