import {
  type LucideIcon,
  LayoutGrid,
  Users2,
  GraduationCap,
  BookMarked,
  CalendarDays,
  Receipt,
  Settings2,
  Warehouse,
  Truck,
  LibraryBig,
  Tv2,
  CheckCircle2,
  PieChart,
  CreditCard,
  FileText,
  Banknote,
  AlertTriangle,
  ScrollText,
  Shield,
  UsersRound,
  TrendingUp,
  ClipboardList,
  Landmark,
  BadgeDollarSign,
} from "lucide-react";
import { Feature } from "@/lib/features/flags";
import { Permission } from "@/lib/roles/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: Feature;
  permission?: Permission;
  requiresStaffProfile?: boolean;
  children?: NavItem[];
}

export const adminNavConfig: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users2,
    feature: Feature.STAFF,
  },
  {
    label: "Students",
    href: "/students",
    icon: GraduationCap,
    feature: Feature.STUDENTS,
  },
  {
    label: "Academics",
    href: "/academics",
    icon: BookMarked,
    children: [
      {
        label: "Grades & Sections",
        href: "/academics/grades",
        icon: BookMarked,
      },
      { label: "Sections", href: "/academics/sections", icon: GraduationCap },
      { label: "Subjects", href: "/academics/subjects", icon: BookMarked },
      {
        label: "Timetable",
        href: "/academics/timetable",
        icon: CalendarDays,
        feature: Feature.TIMETABLE,
      },
    ],
  },
  {
    label: "Attendance",
    href: "/attendance/analytics",
    icon: CheckCircle2,
    feature: Feature.ATTENDANCE,
    children: [
      { label: "Analytics", href: "/attendance/analytics", icon: PieChart },
      {
        label: "Mark Attendance",
        href: "/attendance",
        icon: CheckCircle2,
        permission: Permission.MARK_ATTENDANCE,
        requiresStaffProfile: true,
      },
    ],
  },
  {
    label: "Examinations",
    href: "/exams",
    icon: BookMarked,
    feature: Feature.ECZ_EXAMS,
  },
  {
    label: "Finance",
    href: "/fees/dashboard",
    icon: Receipt,
    feature: Feature.FEES,
    children: [
      { label: "Dashboard", href: "/fees/dashboard", icon: PieChart },
      { label: "Fee Types", href: "/fees/fee-types", icon: ClipboardList },
      { label: "Fee Structure", href: "/fees/structure", icon: Receipt },
      { label: "Invoices", href: "/fees/invoices", icon: FileText },
      { label: "Record Payment", href: "/fees/payments/record", icon: Banknote, permission: Permission.PROCESS_PAYMENTS },
      { label: "Arrears", href: "/fees/arrears", icon: AlertTriangle },
      { label: "Credit Notes", href: "/fees/credit-notes", icon: CreditCard },
      { label: "Sibling Groups", href: "/fees/sibling-groups", icon: UsersRound },
      { label: "Scholarships", href: "/fees/scholarships", icon: BadgeDollarSign },
      { label: "Unallocated", href: "/fees/unallocated", icon: AlertTriangle },
      { label: "Bank Reconciliation", href: "/fees/bank-reconciliation", icon: Landmark },
      { label: "Cashbook", href: "/fees/cashbook", icon: ScrollText },
      { label: "ZRA Compliance", href: "/fees/zra-compliance", icon: Shield },
      { label: "Analytics", href: "/fees/analytics", icon: TrendingUp },
      { label: "Audit Log", href: "/fees/audit-log", icon: ScrollText },
    ],
  },
  {
    label: "Boarding",
    href: "/boarding",
    icon: Warehouse,
    feature: Feature.BOARDING,
  },
  {
    label: "Transport",
    href: "/transport",
    icon: Truck,
    feature: Feature.TRANSPORT,
  },
  {
    label: "Library",
    href: "/library",
    icon: LibraryBig,
    feature: Feature.LIBRARY,
  },
  {
    label: "LMS",
    href: "/lms",
    icon: Tv2,
    feature: Feature.LMS,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
    children: [
      {
        label: "Academic Year",
        href: "/settings/academic-year",
        icon: CalendarDays,
      },
      { label: "School Profile", href: "/settings/profile", icon: Settings2 },
      { label: "Branding", href: "/settings/branding", icon: Settings2 },
      { label: "Features", href: "/settings/features", icon: Settings2 },
      { label: "Users", href: "/settings/users", icon: Users2 },
      { label: "ZRA Settings", href: "/settings/zra", icon: Shield, feature: Feature.ZRA_INVOICING },
      { label: "Payment Settings", href: "/settings/payments", icon: CreditCard, feature: Feature.FEES },
      { label: "Arrears Policy", href: "/settings/arrears-policy", icon: AlertTriangle, feature: Feature.FEES },
    ],
  },
];
