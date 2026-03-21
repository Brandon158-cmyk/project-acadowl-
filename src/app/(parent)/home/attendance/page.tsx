'use client';

import { useQuery } from 'convex/react';
import { CalendarCheck } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function ParentAttendancePage() {
  const attendance = useQuery(api.students.portal.getParentAttendance);

  if (attendance === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Monitor recent attendance marks for each linked learner, including absences, late marks, and excused records."
      />

      <SectionCard title="Recent attendance records" description="The latest attendance entries are grouped by learner.">
        {attendance.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance records available" description="Attendance entries will appear here once the school begins recording them." />
        ) : (
          <div className="space-y-4">
            {attendance.map((entry) => (
              <div key={entry.student._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-onyx">{entry.student.firstName} {entry.student.lastName}</p>
                    <p className="mt-1 text-sm text-slate">{entry.summary.present} present · {entry.summary.absent} absent · {entry.summary.late} late · {entry.summary.excused} excused</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {entry.summary.total} total marks
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {entry.attendance.slice(0, 7).map((record) => (
                        <tr key={record._id} className="transition-colors hover:bg-gray-50/50">
                          <td className="p-3 text-sm text-onyx">{record.date}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800">{record.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
