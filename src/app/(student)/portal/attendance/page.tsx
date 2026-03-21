'use client';

import { useQuery } from 'convex/react';
import { CalendarCheck } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function StudentAttendancePage() {
  const dashboard = useQuery(api.students.portal.getStudentDashboard);

  if (dashboard === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your recorded attendance marks for the current academic period."
      />

      <SectionCard title="Attendance summary" description="Recent attendance entries are shown below.">
        {dashboard.attendance.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance records yet" description="Attendance marks will appear here once they are recorded for your classes." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Present</p><p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.attendanceSummary.present}</p></div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Absent</p><p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.attendanceSummary.absent}</p></div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Late</p><p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.attendanceSummary.late}</p></div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Excused</p><p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.attendanceSummary.excused}</p></div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.attendance.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                      <tr key={record._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4 text-sm text-onyx">{record.date}</td>
                        <td className="p-4 text-right"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800">{record.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
