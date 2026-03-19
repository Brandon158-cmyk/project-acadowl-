import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
}

export const teacherNavConfig: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Classes',
    href: '/classes',
    icon: GraduationCap,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
  },
  {
    label: 'Grades',
    href: '/grades',
    icon: BookOpen,
  },
  {
    label: 'Timetable',
    href: '/timetable',
    icon: Calendar,
    feature: Feature.TIMETABLE,
  },
];
