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
    <Link href={notificationsHref} className="relative rounded-lg p-2 text-slate transition-colors duration-200 hover:bg-gray-100" aria-label="Notifications">
      <Bell className="h-5 w-5" />
      {unreadNotifications && unreadNotifications > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-school-primary px-1 text-[10px] font-semibold text-white">
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
    <div className="hidden items-center gap-2 lg:flex">
      {currentAcademicYear ? (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          {currentAcademicYear.name}
        </span>
      ) : null}
      {currentTerm ? (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
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
            {hasSchoolContext ? <TopbarAcademicContext /> : null}
          </div>
        )}
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        {hasSchoolContext ? <TopbarNotifications role={user?.role} /> : null}

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
