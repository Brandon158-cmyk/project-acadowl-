'use client';

import { type ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-parchment">
        <main className="mx-auto max-w-4xl px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
