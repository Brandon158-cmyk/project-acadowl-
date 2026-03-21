'use client';

import { useQuery } from 'convex/react';
import Link from 'next/link';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMe } from '@/hooks/useMe';
import { SchoolLogo } from '@/components/school/SchoolLogo';

interface TopbarProps {
  schoolName?: string;
  schoolLogoUrl?: string | null;
  onMenuToggle?: () => void;
}

function getNotificationsHref(role?: string) {
  if (role === 'guardian') {
    return '/home/notices';
  }

  if (role === 'student') {
    return '/portal/notices';
  }

  if (role === 'teacher' || role === 'class_teacher') {
    return '/my-classes/notices';
  }

  if (role === 'driver') {
    return '/route/notices';
  }

  return '/notifications';
}

function TopbarNotifications({ role }: { role?: string }) {
  const unreadNotifications = useQuery(api.notifications.getUnreadCount);
  const notificationsHref = getNotificationsHref(role);

  return (
    <Link href={notificationsHref} className="relative rounded-md p-1.5 text-text-secondary transition-all duration-150 hover:bg-surface-hover hover:text-text-primary" aria-label="Notifications">
      <Bell className="h-4 w-4" />
      {unreadNotifications && unreadNotifications > 0 ? (
        <span className="absolute 0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {unreadNotifications > 99 ? '99+' : unreadNotifications}
        </span>
      ) : null}
    </Link>
  );
}

function TopbarAcademicContext() {
  const currentAcademicYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const currentTerm = useQuery(api.schools.terms.getCurrentTerm);

  if (!currentAcademicYear && !currentTerm) {
    return null;
  }

  return (
    <div className="hidden items-center gap-1.5 lg:flex">
      {currentAcademicYear ? (
        <span className="rounded-md bg-info-bg px-2 py-0.5 text-[11px] font-medium text-info border border-info-border">
          {currentAcademicYear.name}
        </span>
      ) : null}
      {currentTerm ? (
        <span className="rounded-md bg-success-bg px-2 py-0.5 text-[11px] font-medium text-success border border-success-border">
          {currentTerm.name}
        </span>
      ) : null}
    </div>
  );
}

export function Topbar({ schoolName, schoolLogoUrl, onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { user } = useMe();
  const hasSchoolContext = Boolean(user?.school?._id);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border-panel bg-white px-4">
      {/* Left: menu toggle + school branding */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {schoolName && (
          <div className="flex items-center gap-3">
            <SchoolLogo logoUrl={schoolLogoUrl} schoolName={schoolName} size="sm" />
            <span className="hidden text-[14px] font-semibold text-text-primary sm:block tracking-tight">
              {schoolName}
            </span>
            {hasSchoolContext ? <TopbarAcademicContext /> : null}
          </div>
        )}
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        {hasSchoolContext ? <TopbarNotifications role={user?.role} /> : null}

        <div className="flex items-center gap-3 border-l border-border-inner pl-3 ml-1">
          <div className="hidden text-right lg:block">
            <p className="text-[13px] font-medium text-text-primary leading-none">{user?.name ?? 'User'}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary capitalize leading-none">{user?.role?.replace('_', ' ') ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-error transition-all duration-150"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
