import {
  LayoutDashboard,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
  requiresStaffProfile?: boolean;
}

export const teacherNavConfig: NavItem[] = [
  {
    label: 'My Classes',
    href: '/my-classes',
    icon: LayoutDashboard,
    requiresStaffProfile: true,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
    requiresStaffProfile: true,
  },
];
