'use client';

import { Bell, Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMe } from '@/hooks/useMe';
import { SchoolLogo } from '@/components/school/SchoolLogo';

interface TopbarProps {
  schoolName?: string;
  schoolLogoUrl?: string | null;
  onMenuToggle?: () => void;
}

export function Topbar({ schoolName, schoolLogoUrl, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user } = useMe();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: menu toggle + school branding */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-slate hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {schoolName && (
          <div className="flex items-center gap-2">
            <SchoolLogo logoUrl={schoolLogoUrl} schoolName={schoolName} size="sm" />
            <span className="hidden font-serif text-base font-semibold text-onyx sm:block">
              {schoolName}
            </span>
          </div>
        )}
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate hover:bg-gray-100 transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-3 ml-1">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-onyx">{user?.name ?? 'User'}</p>
            <p className="text-xs text-slate capitalize">{user?.role?.replace('_', ' ') ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-2 text-slate hover:bg-gray-100 hover:text-error transition-colors duration-200"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
