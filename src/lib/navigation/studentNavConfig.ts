import {
  GraduationCap,
  ClipboardCheck,
  Bell,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';

export interface StudentNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
}

export const studentNavConfig: StudentNavItem[] = [
  {
    label: 'Portal',
    href: '/portal',
    icon: GraduationCap,
  },
  {
    label: 'Progress',
    href: '/portal/progress',
    icon: GraduationCap,
  },
  {
    label: 'Attendance',
    href: '/portal/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
  },
  {
    label: 'Timetable',
    href: '/portal/timetable',
    icon: Calendar,
    feature: Feature.TIMETABLE,
  },
  {
    label: 'Notices',
    href: '/portal/notices',
    icon: Bell,
  },
];
