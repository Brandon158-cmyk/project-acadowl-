'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Bell, BookOpen, CalendarCheck, GraduationCap } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function ParentDashboardPage() {
  const dashboard = useQuery(api.students.portal.getParentDashboard);

  if (dashboard === undefined) {
    return <PageSkeleton />;
  }

  const childrenCount = dashboard.children.length;
  const activeChildren = dashboard.children.filter((entry) => entry.student.enrollmentStatus === 'active').length;
  const combinedAttendance = dashboard.children.reduce((sum, entry) => sum + entry.attendanceSummary.present, 0);
  const unreadNotices = dashboard.notices.filter((notice) => !notice.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guardian Home"
        description="Monitor your children's placement, attendance, and academic progress from one mobile-first dashboard."
      />

      <FeedbackBanner
        tone="info"
        title={`Current family view for ${dashboard.guardian.firstName} ${dashboard.guardian.lastName}`}
        description={childrenCount > 0 ? 'The current academic context and recent notices are shown below.' : 'No student records are linked to this guardian profile yet.'}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Linked children" value={String(childrenCount)} helper="Profiles connected to this guardian account" icon={GraduationCap} />
        <MetricCard label="Active enrolments" value={String(activeChildren)} helper="Children currently marked active" icon={BookOpen} />
        <MetricCard label="Present marks" value={String(combinedAttendance)} helper="Present attendance records recorded so far" icon={CalendarCheck} />
        <MetricCard label="Unread notices" value={String(unreadNotices)} helper="Recent notices awaiting your review" icon={Bell} />
      </div>

      <SectionCard title="Children overview" description="Review placement, attendance summary, and academic standing for each linked learner.">
        {dashboard.children.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No children linked yet" description="Ask the school administration to connect your guardian profile to the relevant student records." />
        ) : (
          <div className="space-y-4">
            {dashboard.children.map((entry) => (
              <div key={entry.student._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-onyx">{entry.student.firstName} {entry.student.lastName}</p>
                    <p className="mt-1 text-sm text-slate">{entry.grade?.name ?? 'Unassigned grade'} · {entry.section?.displayName ?? entry.section?.name ?? 'Unassigned section'}</p>
                    <p className="mt-1 font-mono text-xs text-gray-500">{entry.student.studentNumber}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-800">
                    {entry.student.enrollmentStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attendance</p>
                    <p className="mt-2 text-lg font-semibold text-onyx">{entry.attendanceSummary.present}/{entry.attendanceSummary.total || 0}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Exam average</p>
                    <p className="mt-2 text-lg font-semibold text-onyx">{entry.examAverage === null ? '—' : `${entry.examAverage.toFixed(1)}%`}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current term</p>
                    <p className="mt-2 text-lg font-semibold text-onyx">{entry.currentTerm?.name ?? 'Not active'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Recent notices"
        description="School communications and reminders sent to your account."
        action={<Link href="/home/notices" className="text-sm font-medium text-school-primary transition-all duration-200 hover:underline">View all notices</Link>}
      >
        {dashboard.notices.length === 0 ? (
          <EmptyState icon={Bell} title="No notices yet" description="When the school sends notices to your account, they will appear here." />
        ) : (
          <div className="space-y-3">
            {dashboard.notices.map((notice) => (
              <div key={notice._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-onyx">{notice.title}</p>
                    <p className="mt-1 text-sm text-slate">{notice.body}</p>
                  </div>
                  {!notice.isRead ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Unread</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
