'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Bell, BookOpen, Calendar, CalendarCheck } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function StudentDashboardPage() {
  const dashboard = useQuery(api.students.portal.getStudentDashboard);

  if (dashboard === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Portal"
        description="Review your placement, current academic period, attendance, timetable, and recent notices."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current grade" value={dashboard.grade?.name ?? '—'} helper={dashboard.section?.displayName ?? dashboard.section?.name ?? 'Section not assigned'} icon={BookOpen} />
        <MetricCard label="Attendance" value={String(dashboard.attendanceSummary.present)} helper={`${dashboard.attendanceSummary.total} total attendance marks`} icon={CalendarCheck} />
        <MetricCard label="Exam average" value={dashboard.examAverage === null ? '—' : `${dashboard.examAverage.toFixed(1)}%`} helper="Calculated from recorded exam results" icon={BookOpen} />
        <MetricCard label="Unread notices" value={String(dashboard.notifications.filter((notice) => !notice.isRead).length)} helper="Recent notices sent to your account" icon={Bell} />
      </div>

      <SectionCard title="Current academic context" description="Your live placement for the active academic year and term.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Academic year</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-onyx">{dashboard.currentAcademicYear?.name ?? 'Not active'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current term</p>
            <p className="mt-2 font-serif text-2xl font-semibold text-onyx">{dashboard.currentTerm?.name ?? 'Not active'}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Upcoming timetable" description="Your current class timetable based on your section placement." action={<Link href="/portal/timetable" className="text-sm font-medium text-school-primary transition-all duration-200 hover:underline">Open timetable</Link>}>
        <div className="space-y-3">
          {dashboard.timetableSlots.slice(0, 4).map((slot) => (
            <div key={slot._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-onyx">Day {slot.dayOfWeek + 1}</p>
                  <p className="mt-1 text-sm text-slate">{slot.startTime} - {slot.endTime}</p>
                </div>
                <Calendar className="h-5 w-5 text-slate" aria-hidden="true" />
              </div>
            </div>
          ))}
          {dashboard.timetableSlots.length === 0 ? <p className="text-sm text-slate">No timetable slots have been configured for your current section yet.</p> : null}
        </div>
      </SectionCard>
    </div>
  );
}
