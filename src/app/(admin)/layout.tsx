'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useMobileNav } from '@/components/layout/MobileNav';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMe } from '@/hooks/useMe';
import { SchoolProvider } from '@/providers/SchoolProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isOpen, close, toggle } = useMobileNav();
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
        <div className="flex h-screen overflow-hidden bg-parchment">
          <AdminSidebar isOpen={isOpen} onClose={close} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar
              schoolName={user.school.name}
              schoolLogoUrl={user.school.branding?.logoUrl}
              onMenuToggle={toggle}
            />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SchoolProvider>
    </AuthGuard>
  );
}
