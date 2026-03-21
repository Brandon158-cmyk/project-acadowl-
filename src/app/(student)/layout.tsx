'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StudentShell } from '@/components/layout/StudentShell';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMe } from '@/hooks/useMe';
import { SchoolProvider } from '@/providers/SchoolProvider';

export default function StudentLayout({ children }: { children: ReactNode }) {
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
        <StudentShell>{children}</StudentShell>
      </SchoolProvider>
    </AuthGuard>
  );
}
