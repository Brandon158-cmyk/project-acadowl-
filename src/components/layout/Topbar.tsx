"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  GraduationCap,
  ChevronsUpDown,
  Calendar,
  LogOut,
} from "lucide-react";
import { api } from "@/../convex/_generated/api";
import { useMe } from "@/hooks/useMe";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onMenuToggle?: () => void;
}

function getNotificationsHref(role?: string) {
  if (role === "guardian") {
    return "/home/notices";
  }

  if (role === "student") {
    return "/portal/notices";
  }

  if (role === "teacher" || role === "class_teacher") {
    return "/my-classes/notices";
  }

  if (role === "driver") {
    return "/route/notices";
  }

  return "/notifications";
}

function TopbarNotifications({ role }: { role?: string }) {
  const unreadNotifications = useQuery(api.notifications.getUnreadCount);
  const notificationsHref = getNotificationsHref(role);

  return (
    <Link
      href={notificationsHref}
      className="relative rounded-md p-1.5 text-text-secondary transition-all duration-150 hover:bg-surface-hover hover:text-text-primary"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadNotifications && unreadNotifications > 0 ? (
        <span className="absolute 0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {unreadNotifications > 99 ? "99+" : unreadNotifications}
        </span>
      ) : null}
    </Link>
  );
}

function TopbarAcademicContext() {
  const currentAcademicYear = useQuery(
    api.schools.academicYears.getCurrentAcademicYear,
  );
  const currentTerm = useQuery(api.schools.terms.getCurrentTerm);

  if (!currentAcademicYear && !currentTerm) return null;

  return (
    <div className="flex h-10 items-center gap-2 rounded-full border border-[#22C55E] bg-[#DCFCE7] px-4 py-1 text-[13px] font-semibold text-[#15803D] shadow-sm transition-all hover:shadow-md cursor-pointer group">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-[#15803D] opacity-80" />
        <span className="tracking-tight leading-none">
          {currentAcademicYear?.name ?? "2025/26"} •{" "}
          {currentTerm?.name ?? "First Term"}
        </span>
      </div>
    </div>
  );
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useMe();
  const router = useRouter();
  const hasSchoolContext = Boolean(user?.school?._id);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-border-panel bg-white px-4">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
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
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent transition-transform group-hover:scale-105 shadow-sm">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-bold text-text-primary tracking-tight">
            Acadowl
          </span>
        </Link>

        {/* Academic Context Pill moved closer to Logo */}
        <div className="hidden lg:block">
          <TopbarAcademicContext />
        </div>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pr-2">
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-text-secondary hover:bg-surface-hover transition-colors">
            Ask AI
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-text-secondary hover:bg-surface-hover transition-colors">
            Support
          </button>
        </div>

        {hasSchoolContext && <TopbarNotifications role={user?.role} />}

        <div className="flex items-center gap-3 border-l border-border-inner pl-3 ml-1">
          <div className="hidden text-right lg:block">
            <p className="text-[13px] font-medium text-text-primary leading-none">
              {user?.name ?? "User"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button
                type="button"
                className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-accent/20 transition-colors"
              >
                <span className="text-[10px] font-bold text-accent">
                  {user?.name?.[0].toUpperCase()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
