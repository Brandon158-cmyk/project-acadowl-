'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PlatformSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Schools', href: '/schools', icon: Building2 },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function PlatformSidebar({ isOpen, onClose }: PlatformSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-school-primary flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="font-serif text-base font-semibold text-onyx">
              Acadowl Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4" aria-label="Platform navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
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
          })}
        </nav>
      </aside>
    </>
  );
}
