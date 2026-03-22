"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  MessageSquare,
  Activity,
  ArrowRight,
  CreditCard,
  FileText,
  Video,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/../convex/_generated/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils/cn";

// ─── Helpers ───────────────────────────────────────────────────────────────

function todayString() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Context strip ─────────────────────────────────────────────────────────

function CtxItem({
  label,
  value,
  sub,
  last = false,
}: {
  label: string;
  value: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-4 py-2.5",
        !last && "border-r border-border-inner",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
        {label}
      </p>
      <p className="text-[14px] font-bold text-text-primary">{value}</p>
      {sub && <p className="text-[11px] text-text-secondary">{sub}</p>}
    </div>
  );
}

// ─── Alert chip ────────────────────────────────────────────────────────────

function AlertChip({
  label,
  href,
  variant,
}: {
  label: string;
  href: string;
  variant: "error" | "warning" | "info";
}) {
  const cls = {
    error: "bg-error-bg border-error-border text-[var(--error)]",
    warning: "bg-warning-bg border-[#FDE68A] text-[var(--warning)]",
    info: "bg-info-bg border-info-border text-[var(--info)]",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-1.5",
        "text-[12px] font-medium transition-opacity duration-150 hover:opacity-80",
        cls,
      )}
    >
      {label}
      <ArrowRight size={11} aria-hidden="true" />
    </Link>
  );
}

// ─── Attendance donut ──────────────────────────────────────────────────────

function AttendanceRing({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const color = pct >= 90 ? "#15803D" : pct >= 70 ? "#B45309" : "#BE123C";
  return (
    <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
      <svg
        width="96"
        height="96"
        viewBox="0 0 100 100"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#F4F1EE"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold text-text-primary leading-none">
          {pct}%
        </span>
        <span className="text-[10px] text-text-tertiary mt-0.5">today</span>
      </div>
    </div>
  );
}

// ─── Weekly bar ────────────────────────────────────────────────────────────

function WeekBar({
  pct,
  day,
  today,
}: {
  pct: number;
  day: string;
  today?: boolean;
}) {
  const color = pct >= 90 ? "#15803D" : pct >= 70 ? "#B45309" : "#BE123C";
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div
        className="w-full rounded-[3px] bg-surface-subtle flex flex-col justify-end overflow-hidden"
        style={{ height: 52 }}
      >
        <div
          style={{
            height: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: "height 0.4s ease",
          }}
        />
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          today ? "text-accent" : "text-text-tertiary",
        )}
      >
        {day}
      </span>
    </div>
  );
}

// ─── Quick action ──────────────────────────────────────────────────────────

const QA_COLORS = {
  accent: {
    bg: "bg-accent-bg",
    icon: "text-accent",
    border: "hover:border-accent/30",
  },
  success: {
    bg: "bg-success-bg",
    icon: "text-[var(--success)]",
    border: "hover:border-success-border",
  },
  warning: {
    bg: "bg-warning-bg",
    icon: "text-[var(--warning)]",
    border: "hover:border-[#FDE68A]",
  },
  info: {
    bg: "bg-info-bg",
    icon: "text-[var(--info)]",
    border: "hover:border-info-border",
  },
  purple: {
    bg: "bg-[#F3F0FF]",
    icon: "text-[#6D28D9]",
    border: "hover:border-[#C4B5FD]",
  },
} as const;

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
  color = "accent",
  wide = false,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color?: keyof typeof QA_COLORS;
  wide?: boolean;
}) {
  const c = QA_COLORS[color];
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[6px] border border-border-inner p-3",
        "transition-all duration-150 hover:bg-surface-subtle",
        c.border,
        wide && "col-span-2",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[6px]",
          c.bg,
        )}
      >
        <Icon size={14} className={c.icon} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-tertiary">{description}</p>
      </div>
      {wide && (
        <ArrowRight
          size={13}
          className="flex-shrink-0 text-border-panel"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

// ─── Feed item ─────────────────────────────────────────────────────────────

const FEED_TYPES: Record<
  string,
  { bg: string; stroke: string; icon: LucideIcon }
> = {
  attendance: {
    bg: "bg-success-bg",
    stroke: "text-[var(--success)]",
    icon: ClipboardCheck,
  },
  fees: {
    bg: "bg-warning-bg",
    stroke: "text-[var(--warning)]",
    icon: CreditCard,
  },
  results: { bg: "bg-info-bg", stroke: "text-[var(--info)]", icon: FileText },
  default: {
    bg: "bg-surface-subtle",
    stroke: "text-text-secondary",
    icon: Activity,
  },
};

function FeedItem({
  item,
}: {
  item: {
    _id: string;
    type: string;
    title: string;
    body: string;
    createdAt: number;
    link?: string;
  };
}) {
  const cfg = FEED_TYPES[item.type] ?? FEED_TYPES.default;
  const Icon = cfg.icon;
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-surface-subtle transition-colors duration-100 border-b border-border-row last:border-b-0">
      <div
        className={cn(
          "flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[6px] mt-0.5",
          cfg.bg,
        )}
      >
        <Icon size={13} className={cfg.stroke} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-text-primary leading-snug">
          {item.title}
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary truncate">
          {item.body}
        </p>
        <p className="mt-1 text-[10px] text-text-tertiary">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
      {item.link && (
        <Link
          href={item.link}
          aria-label={`View: ${item.title}`}
          className="flex-shrink-0 mt-0.5 text-text-tertiary hover:text-accent transition-colors duration-100"
        >
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      )}
    </li>
  );
}

// ─── Upcoming event ────────────────────────────────────────────────────────

function UpcomingEvent({
  day,
  month,
  title,
  meta,
}: {
  day: number;
  month: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border-row last:border-b-0 hover:bg-surface-subtle transition-colors duration-100">
      <div className="w-9 flex-shrink-0 text-center">
        <div className="text-[18px] font-bold text-accent leading-none">
          {day}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">
          {month}
        </div>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-[11px] text-text-secondary">{meta}</p>
      </div>
    </div>
  );
}

// ─── Placeholder weekly data ────────────────────────────────────────────────
// Replace with a real query when the endpoint exists.

const WEEK_DATA = [
  { day: "Mon", pct: 88 },
  { day: "Tue", pct: 92 },
  { day: "Wed", pct: 79 },
  { day: "Thu", pct: 85 },
  { day: "Fri", pct: 87, today: true },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const stats = useQuery(api.schools.dashboardQueries.getDashboardStats);
  if (stats === undefined) return <PageSkeleton />;

  const rate = stats.attendanceRate ?? 0;
  const present = stats.totalMarkedToday;
  const total = stats.activeStudents || stats.totalStudents;
  const absent = Math.max(0, total - present);
  const late = Math.round(present * 0.05);
  const unmarked = Math.max(0, total - present - absent);

  const attendanceColor =
    rate >= 90 ? "success" : rate >= 70 ? "warning" : ("error" as const);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page header — editorial, no repeated stats ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: greeting left, context strip right */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Kabulonga Boys Secondary School
            </p>
            <h1 className="mt-1.5 text-[22px] font-bold text-text-primary tracking-[-0.02em] leading-tight">
              Good morning, Brandon
            </h1>
            <p className="mt-1 text-[12px] text-text-secondary">
              {todayString()} · Week 9 of Term 1
            </p>
          </div>

          {/* Context strip — academic context only, no metric duplication */}
          <div className="flex items-stretch bg-surface border border-border-panel rounded-lg overflow-hidden flex-shrink-0">
            <CtxItem
              label="Academic year"
              value="2025 / 2026"
              sub="Term 1 of 3"
            />
            <CtxItem
              label="School week"
              value="Week 9 of 13"
              sub="4 weeks left"
            />
            <div className="flex flex-col gap-0.5 px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
                Term progress
              </p>
              <p className="text-[14px] font-bold text-text-primary">68%</p>
              <div className="mt-1 h-[4px] w-[80px] rounded-full bg-surface-subtle">
                <div className="h-full w-[68%] rounded-full bg-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: alerts — things that need action, not decoration */}
        {(unmarked > 0 || stats.smsBalance < 50) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
              Needs attention
            </span>
            {unmarked > 0 && (
              <AlertChip
                label={`${unmarked} attendance records unmarked`}
                href="/attendance"
                variant="error"
              />
            )}
            {stats.smsBalance < 50 && (
              <AlertChip
                label={`SMS balance low — ${stats.smsBalance} credits remaining`}
                href="/settings/sms"
                variant="warning"
              />
            )}
            <AlertChip
              label="End of term exams in 3 days"
              href="/exams"
              variant="info"
            />
          </div>
        )}
      </div>

      {/* ── Metric cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Students"
          value={String(stats.activeStudents)}
          helper={`${stats.totalStudents} total enrolled`}
          icon={GraduationCap}
          color="accent"
        />
        <MetricCard
          label="Teaching Staff"
          value={String(stats.activeStaff)}
          helper={`${stats.totalStaff} total records`}
          icon={Users}
          color="success"
        />
        <MetricCard
          label="Attendance Today"
          value={
            stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "—"
          }
          helper={present > 0 ? `${present} of ${total} marked` : "No data yet"}
          icon={ClipboardCheck}
          color={attendanceColor}
        />
        <MetricCard
          label="SMS Balance"
          value={String(stats.smsBalance)}
          helper="Available credits"
          icon={MessageSquare}
          color={stats.smsBalance < 50 ? "warning" : "info"}
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_296px]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          {/* Attendance card */}
          <div className="bg-surface border border-border-panel rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-inner">
              <div>
                <p className="text-[13px] font-semibold text-text-primary">
                  Attendance overview
                </p>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Term 1 · Week 9
                </p>
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium px-2.5 py-1 rounded-[5px]",
                  rate >= 90
                    ? "bg-success-bg text-[var(--success)]"
                    : rate >= 70
                      ? "bg-warning-bg text-[var(--warning)]"
                      : "bg-error-bg text-[var(--error)]",
                )}
              >
                {rate >= 90
                  ? "On target"
                  : rate >= 70
                    ? "Below target"
                    : "Critical"}
              </span>
            </div>

            <div className="flex items-center gap-6 px-5 py-5">
              <AttendanceRing pct={rate || 0} />
              <div className="flex flex-1 flex-col gap-2.5">
                {[
                  { label: "Present", val: present, color: "#15803D" },
                  { label: "Absent", val: absent, color: "#BE123C" },
                  { label: "Late", val: late, color: "#B45309" },
                  { label: "Not marked", val: unmarked, color: "#E5DFD8" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                      <div
                        className="h-[7px] w-[7px] rounded-[2px] flex-shrink-0"
                        style={{ background: r.color }}
                      />
                      {r.label}
                    </div>
                    <span className="text-[12px] font-semibold text-text-primary">
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-inner px-5 pb-4 pt-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.07em] text-text-tertiary">
                This week
              </p>
              <div className="flex gap-2">
                {WEEK_DATA.map((d) => (
                  <WeekBar
                    key={d.day}
                    pct={d.pct}
                    day={d.day}
                    today={d.today}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-surface border border-border-panel rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-inner">
              <p className="text-[13px] font-semibold text-text-primary">
                Quick actions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              <QuickAction
                title="Enroll student"
                description="Add new record"
                href="/students/enroll"
                icon={UserPlus}
                color="accent"
              />
              <QuickAction
                title="Mark attendance"
                description="Today's register"
                href="/attendance"
                icon={ClipboardCheck}
                color="success"
              />
              <QuickAction
                title="Fee invoices"
                description="43 outstanding"
                href="/finance/invoices"
                icon={CreditCard}
                color="warning"
              />
              <QuickAction
                title="Exam results"
                description="Upload grades"
                href="/exams"
                icon={FileText}
                color="info"
              />
              <QuickAction
                title="Learning management system"
                description="Courses, lessons & assessments"
                href="/lms"
                icon={Video}
                color="purple"
                wide
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Activity feed */}
          <div className="bg-surface border border-border-panel rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-inner flex-shrink-0">
              <p className="text-[13px] font-semibold text-text-primary">
                Recent activity
              </p>
              {stats.recentActivity.length > 0 && (
                <Link
                  href="/activity"
                  className="text-[11px] font-medium text-accent-text hover:underline transition-colors duration-100"
                >
                  View all
                </Link>
              )}
            </div>

            {stats.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="h-10 w-10 rounded-[8px] bg-surface-subtle flex items-center justify-center">
                  <Activity
                    size={18}
                    className="text-text-tertiary"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[12px] font-medium text-text-primary">
                  No activity yet
                </p>
                <p className="text-[11px] text-text-secondary">
                  Updates appear here as they happen.
                </p>
              </div>
            ) : (
              <ul>
                {stats.recentActivity.map((item) => (
                  <FeedItem key={item._id} item={item} />
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming events */}
          <div className="bg-surface border border-border-panel rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-inner">
              <p className="text-[13px] font-semibold text-text-primary">
                Upcoming events
              </p>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-info-bg text-[var(--info)]">
                3 this week
              </span>
            </div>
            <UpcomingEvent
              day={24}
              month="Mar"
              title="End of Term 1 exams"
              meta="All forms · Main hall · 8:00 AM"
            />
            <UpcomingEvent
              day={26}
              month="Mar"
              title="Parent-teacher conferences"
              meta="Staff & parents · Library · 2:00 PM"
            />
            <UpcomingEvent
              day={28}
              month="Mar"
              title="Term 1 closes"
              meta="School-wide · Half day"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
