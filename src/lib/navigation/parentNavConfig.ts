import {
  LayoutDashboard,
  DollarSign,
  MessageSquare,
  Megaphone,
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
    label: 'Dashboard',
    href: '/home',
    icon: LayoutDashboard,
  },
  {
    label: 'Fees',
    href: '/fees',
    icon: DollarSign,
    feature: Feature.FEES,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    label: 'Notices',
    href: '/announcements',
    icon: Megaphone,
  },
  {
    label: 'Alerts',
    href: '/profile/notifications',
    icon: Bell,
  },
];
