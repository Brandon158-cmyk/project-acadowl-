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
    href: '/home',
    icon: LayoutDashboard,
  },
  {
    label: 'Progress',
    href: '/home/progress',
    icon: GraduationCap,
  },
  {
    label: 'Attendance',
    href: '/home/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
  },
  {
    label: 'Fees',
    href: '/home/fees',
    icon: DollarSign,
    feature: Feature.FEES,
  },
  {
    label: 'Notices',
    href: '/home/notices',
    icon: Bell,
  },
];
