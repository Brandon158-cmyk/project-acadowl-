'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { studentNavConfig, type StudentNavItem } from '@/lib/navigation/studentNavConfig';
import { useFeature } from '@/hooks/useFeature';
import { useMe } from '@/hooks/useMe';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface StudentShellProps {
  children: ReactNode;
}

function BottomNavItem({ item, pathname }: { item: StudentNavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const isEnabled = useFeature(item.feature!);

  if (item.feature && !isEnabled) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs font-medium transition-all duration-200',
        isActive ? 'text-school-primary' : 'text-slate',
      )}
    >
      <item.icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function StudentShell({ children }: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useMe();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div>
          <p className="font-serif text-base font-semibold text-onyx">Student Portal</p>
          <p className="text-xs text-slate">{user?.school?.name ?? 'Acadowl'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="max-w-32 truncate text-sm text-slate">{user?.name}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-slate transition-all duration-200 hover:text-red-600"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 bg-white px-2 py-1"
        aria-label="Student navigation"
      >
        {studentNavConfig.map((item) => (
          <BottomNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}
