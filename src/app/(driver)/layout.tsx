'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMe } from '@/hooks/useMe';
import { SchoolProvider } from '@/providers/SchoolProvider';

export default function DriverLayout({ children }: { children: ReactNode }) {
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
        <div className="min-h-screen bg-parchment">
          <main className="mx-auto max-w-lg px-4 py-6">
            {children}
          </main>
        </div>
      </SchoolProvider>
    </AuthGuard>
  );
}
