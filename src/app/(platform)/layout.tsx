'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useMobileNav } from '@/components/layout/MobileNav';
import { useMe } from '@/hooks/useMe';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const { isOpen, close, toggle } = useMobileNav();
  const { user, isLoading } = useMe();
  const pathname = usePathname();

  // Allow unauthenticated access to /signup
  if (pathname === '/signup') {
    return <>{children}</>;
  }

  // Role guard — only platform_admin can access
  if (!isLoading && user && user.role !== 'platform_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="font-serif text-xl font-semibold text-onyx">Access Denied</h2>
          <p className="mt-2 text-sm text-slate">
            Only platform administrators can access this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-parchment">
        <PlatformSidebar isOpen={isOpen} onClose={close} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            schoolName="Acadowl Platform"
            onMenuToggle={toggle}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
