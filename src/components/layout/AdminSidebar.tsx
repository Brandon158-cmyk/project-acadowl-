'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { adminNavConfig, type NavItem } from '@/lib/navigation/adminNavConfig';
import { useFeature } from '@/hooks/useFeature';
import { cn } from '@/lib/utils/cn';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const isFeatureEnabled = useFeature(item.feature!);

  // If feature-gated and not enabled, don't render
  if (item.feature && !isFeatureEnabled) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-school-primary/10 text-school-primary'
          : 'text-slate hover:bg-gray-100 hover:text-onyx',
      )}
    >
      <item.icon
        className={cn(
          'h-5 w-5 shrink-0',
          isActive ? 'text-school-primary' : 'text-slate group-hover:text-onyx',
        )}
        aria-hidden="true"
      />
      {item.label}
    </Link>
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
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Mobile close */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 lg:hidden">
          <span className="font-serif text-lg font-semibold text-onyx">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4" aria-label="Admin navigation">
          {adminNavConfig.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  );
}
