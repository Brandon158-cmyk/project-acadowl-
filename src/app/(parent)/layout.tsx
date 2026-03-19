'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ParentShell } from '@/components/layout/ParentShell';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <ParentShell>{children}</ParentShell>
    </AuthGuard>
  );
}
