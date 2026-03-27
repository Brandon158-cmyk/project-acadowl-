'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { parentNavConfig } from '@/lib/navigation/parentNavConfig';
import { useFeature } from '@/hooks/useFeature';
import { useMe } from '@/hooks/useMe';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import type { NavItem } from '@/lib/navigation/parentNavConfig';

interface ParentShellProps {
  children: ReactNode;
}

function BottomNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.href === '/home'
    ? pathname === '/home'
    : pathname === item.href || pathname.startsWith(item.href + '/');
  const isEnabled = useFeature(item.feature!);

  if (item.feature && !isEnabled) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs font-medium transition-colors duration-200',
        isActive ? 'text-school-primary' : 'text-slate',
      )}
    >
      <item.icon className="h-5 w-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

// Mobile-first parent shell with bottom tab navigation
export function ParentShell({ children }: ParentShellProps) {
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
      {/* Top header — minimal for mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <span className="font-serif text-base font-semibold text-onyx">
          Acadowl
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate">{user?.name}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-slate hover:text-error transition-colors duration-200"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content — scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {children}
      </main>

      {/* Bottom tab bar — mobile-first */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 bg-white px-2 py-1 safe-area-inset-bottom"
        aria-label="Parent navigation"
      >
        {parentNavConfig.map((item) => (
          <BottomNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}
