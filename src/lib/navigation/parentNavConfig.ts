import {
  LayoutDashboard,
  GraduationCap,
  DollarSign,
  ClipboardCheck,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
}

export const parentNavConfig: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: GraduationCap,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
  },
  {
    label: 'Fees',
    href: '/fees',
    icon: DollarSign,
    feature: Feature.FEES,
  },
  {
    label: 'Notices',
    href: '/notices',
    icon: Bell,
  },
];
