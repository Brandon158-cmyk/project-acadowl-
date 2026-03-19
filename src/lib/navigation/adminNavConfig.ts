import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  Settings,
  Building2,
  Bus,
  Library,
  MonitorPlay,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
  children?: NavItem[];
}

export const adminNavConfig: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: Users,
    feature: Feature.STAFF,
  },
  {
    label: 'Students',
    href: '/students',
    icon: GraduationCap,
    feature: Feature.STUDENTS,
  },
  {
    label: 'Academics',
    href: '/academics',
    icon: BookOpen,
    children: [
      { label: 'Grades & Sections', href: '/academics/grades', icon: BookOpen },
      { label: 'Subjects', href: '/academics/subjects', icon: BookOpen },
      { label: 'Timetable', href: '/academics/timetable', icon: Calendar, feature: Feature.TIMETABLE },
    ],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    feature: Feature.ATTENDANCE,
  },
  {
    label: 'Examinations',
    href: '/exams',
    icon: BookOpen,
    feature: Feature.ECZ_EXAMS,
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: DollarSign,
    feature: Feature.FEES,
    children: [
      { label: 'Fee Structures', href: '/finance/fee-structures', icon: DollarSign },
      { label: 'Invoices', href: '/finance/invoices', icon: DollarSign },
      { label: 'Payments', href: '/finance/payments', icon: DollarSign },
    ],
  },
  {
    label: 'Boarding',
    href: '/boarding',
    icon: Building2,
    feature: Feature.BOARDING,
  },
  {
    label: 'Transport',
    href: '/transport',
    icon: Bus,
    feature: Feature.TRANSPORT,
  },
  {
    label: 'Library',
    href: '/library',
    icon: Library,
    feature: Feature.LIBRARY,
  },
  {
    label: 'LMS',
    href: '/lms',
    icon: MonitorPlay,
    feature: Feature.LMS,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { label: 'School Profile', href: '/settings/profile', icon: Settings },
      { label: 'Branding', href: '/settings/branding', icon: Settings },
      { label: 'Features', href: '/settings/features', icon: Settings },
      { label: 'Users', href: '/settings/users', icon: Users },
    ],
  },
];
