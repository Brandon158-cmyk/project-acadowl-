'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { GraduationCap, Users, ClipboardCheck, MessageSquare, Activity, ArrowRight, type LucideIcon } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AdminDashboardPage() {
  const stats = useQuery(api.schools.dashboardQueries.getDashboardStats);

  if (stats === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your school at a glance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Students"
          value={String(stats.activeStudents)}
          helper={`${stats.totalStudents} total enrolled`}
          icon={GraduationCap}
        />
        <MetricCard
          label="Staff Members"
          value={String(stats.activeStaff)}
          helper={`${stats.totalStaff} total records`}
          icon={Users}
        />
        <MetricCard
          label="Attendance Today"
          value={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
          helper={stats.totalMarkedToday > 0 ? `${stats.totalMarkedToday} students marked` : 'No attendance recorded yet'}
          icon={ClipboardCheck}
        />
        <MetricCard
          label="SMS Balance"
          value={String(stats.smsBalance)}
          helper="Available SMS credits"
          icon={MessageSquare}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="Enroll Student"
          description="Add a new student to the school"
          href="/students/enroll"
          icon={GraduationCap}
        />
        <QuickAction
          title="Mark Attendance"
          description="Take attendance for today"
          href="/attendance/analytics"
          icon={ClipboardCheck}
        />
        <QuickAction
          title="Manage Staff"
          description="View and manage staff records"
          href="/staff"
          icon={Users}
        />
      </div>

      {/* Recent Activity Feed */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate" aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold text-onyx">Recent Activity</h2>
        </div>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-slate">No recent activity to display.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.recentActivity.map((item) => (
              <li key={item._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <ActivityIcon type={item.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="truncate text-sm text-gray-500">{item.body}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {item.link && (
                  <Link
                    href={item.link}
                    className="shrink-0 text-sm text-school-primary hover:text-crimson-dark"
                    aria-label={`View details: ${item.title}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickAction({ title, description, href, icon: Icon }: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-school-primary/30 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-school-primary/10">
        <Icon className="h-5 w-5 text-school-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-onyx group-hover:text-school-primary">{title}</p>
        <p className="text-sm text-slate">{description}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-school-primary" />
    </Link>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'attendance':
      return <ClipboardCheck className="h-4 w-4 text-success" />;
    case 'fees':
      return <MessageSquare className="h-4 w-4 text-warning" />;
    case 'results':
      return <GraduationCap className="h-4 w-4 text-info" />;
    default:
      return <Activity className="h-4 w-4 text-slate" />;
  }
}
