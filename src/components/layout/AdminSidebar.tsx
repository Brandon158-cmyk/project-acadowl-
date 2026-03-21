'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { adminNavConfig, type NavItem } from '@/lib/navigation/adminNavConfig';
import { Feature } from '@/lib/features/flags';
import { useFeature } from '@/hooks/useFeature';
import { useMe } from '@/hooks/useMe';
import { canDo } from '@/lib/roles/matrix';
import { cn } from '@/lib/utils/cn';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavEntry({ item, pathname, depth = 0 }: { item: NavItem; pathname: string; depth?: number }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const feature = item.feature;
  const isFeatureEnabled = useFeature(feature ?? Feature.STUDENTS);
  const { user } = useMe();
  const hasPermission = item.permission ? Boolean(user?.role && canDo(user.role, item.permission)) : true;

  if (feature && !isFeatureEnabled) {
    return null;
  }

  if (item.permission && !hasPermission) {
    return null;
  }

  if (item.requiresStaffProfile && !user?.staffId) {
    return null;
  }

  return (
    <div className={cn('space-y-1', depth > 0 && 'pl-4')}>
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-normal transition-all duration-150',
          isActive
            ? 'bg-accent-bg text-accent font-medium'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        )}
      >
        <item.icon
          className={cn(
            'h-4 w-4 shrink-0',
            isActive ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary',
          )}
          aria-hidden="true"
        />
        <span>{item.label}</span>
      </Link>

      {item.children && item.children.length > 0 && (
        <div className="space-y-1 border-l border-border-inner ml-5 pl-2">
          {item.children.map((child) => (
            <NavEntry key={child.href} item={child} pathname={pathname} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] transform border-r border-border-panel bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Mobile close */}
        <div className="flex h-12 items-center justify-between border-b border-border-inner px-4 lg:hidden">
          <span className="text-[14px] font-semibold text-text-primary">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin navigation">
          {adminNavConfig.map((item) => (
            <NavEntry key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  );
}
