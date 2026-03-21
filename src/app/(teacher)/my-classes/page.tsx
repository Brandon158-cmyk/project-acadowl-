'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { Bell, BookOpen, Calendar, GraduationCap, Users } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';
import { useMe } from '@/hooks/useMe';

function TeacherDashboardContent() {
  const overview = useQuery(api.schools.teacher.getMyClassOverview);

  if (overview === undefined) {
    return <PageSkeleton />;
  }

  const timetableCount = overview.timetable.length;
  const assignmentCount = overview.assignments.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description="Review your class section, student roster, assignments, and timetable context for the active academic year."
      />

      {!overview.classSection ? (
        <FeedbackBanner
          tone="warning"
          title="You have not been assigned a class section"
          description="A school administrator needs to assign you as a class teacher before a section roster can appear here."
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Class section" value={overview.classSection?.displayName ?? overview.classSection?.name ?? 'None'} helper={overview.currentAcademicYear?.name ?? 'No active academic year'} icon={GraduationCap} />
        <MetricCard label="Roster size" value={String(overview.roster.length)} helper="Students currently linked to your class section" icon={Users} />
        <MetricCard label="Subject assignments" value={String(assignmentCount)} helper="Current teaching assignments on file" icon={BookOpen} />
        <MetricCard label="Timetable slots" value={String(timetableCount)} helper="Slots currently assigned to you" icon={Calendar} />
      </div>

      <SectionCard title="Class roster" description="Each student row includes quick attendance and results context for your class supervision.">
        {!overview.classSection ? (
          <EmptyState icon={Users} title="No class section assigned" description="Once a class section is assigned, the student roster and quick actions will appear here." />
        ) : overview.roster.length === 0 ? (
          <EmptyState icon={Users} title="No students placed yet" description="Students placed into your class section will appear here once enrolment and section assignment are complete." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Attendance</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Average</th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overview.roster.map((student) => (
                    <tr key={student._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-medium text-onyx">{student.firstName} {student.lastName}</p>
                        <p className="mt-1 font-mono text-xs text-gray-500">{student.studentNumber}</p>
                      </td>
                      <td className="p-4 text-sm text-slate">{student.attendanceThisWeek}</td>
                      <td className="p-4 text-sm text-slate">{student.lastResultAverage === null ? '—' : `${student.lastResultAverage.toFixed(1)}%`}</td>
                      <td className="p-4 text-right">
                        <Link href={`/students/${student._id}`} className="text-sm font-medium text-school-primary transition-all duration-200 hover:underline">View profile</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Teaching load" description="Current subject assignments and timetable slots linked to your staff profile.">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-semibold text-onyx">Assignments</h3>
            {overview.assignments.length === 0 ? (
              <p className="text-sm text-slate">No subject assignments are configured yet.</p>
            ) : (
              overview.assignments.map((assignment) => (
                <div key={assignment._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="font-medium text-onyx">{assignment.subject?.name ?? 'Subject not found'}</p>
                  <p className="mt-1 text-sm text-slate">{assignment.section?.displayName ?? assignment.section?.name ?? 'Section not found'}</p>
                </div>
              ))
            )}
          </div>
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-semibold text-onyx">Today&apos;s timetable</h3>
            {overview.todaysTimetable.length === 0 ? (
              <p className="text-sm text-slate">No timetable slots are scheduled for you today.</p>
            ) : (
              overview.todaysTimetable.map((slot) => (
                <div key={slot._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="font-medium text-onyx">Day {slot.dayOfWeek + 1}</p>
                  <p className="mt-1 text-sm text-slate">{slot.startTime} - {slot.endTime}{slot.room ? ` · Room ${slot.room}` : ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent notices" description="The most recent notices and alerts delivered to your account.">
        {overview.notices.length === 0 ? (
          <EmptyState icon={Bell} title="No recent notices" description="School notifications sent to your account will appear here." />
        ) : (
          <div className="space-y-3">
            {overview.notices.map((notice) => (
              <div key={notice._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
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

export default function TeacherDashboardPage() {
  const { user, isLoading } = useMe();
  const hasStaffProfile = Boolean(user?.staffId);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!hasStaffProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Classes"
          description="Review your class section, student roster, assignments, and timetable context for the active academic year."
        />
        <FeedbackBanner
          tone="warning"
          title="Your account is not linked to a teaching staff profile"
          description="A school administrator needs to link your user account to a staff record before class oversight can appear here."
        />
        <SectionCard title="Class roster" description="Once your staff profile is linked, your class roster and teaching context will appear here.">
          <EmptyState
            icon={Users}
            title="No teaching profile linked"
            description="Ask a school administrator to connect your account to the correct staff record."
          />
        </SectionCard>
      </div>
    );
  }

  return <TeacherDashboardContent />;
}
