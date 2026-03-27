'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Attendance', href: '/attendance' },
  { label: 'Results', href: '/results' },
  { label: 'Fees', href: '/fees' },
  { label: 'Messages', href: '/messages' },
];

export default function ParentChildLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ studentId: string }>();
  const base = `/children/${params.studentId}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/home" className="text-sm font-medium text-slate hover:underline">
          ← My Children
        </Link>
      </div>

      <div className="sticky top-14 z-20 -mx-4 overflow-x-auto border-y border-gray-200 bg-white px-4 py-2">
        <div className="flex min-w-max items-center gap-2">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const active = pathname === href;

            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium',
                  active ? 'bg-school-primary text-white' : 'bg-gray-100 text-gray-700',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
