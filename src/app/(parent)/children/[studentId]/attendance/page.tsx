'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarClock } from 'lucide-react';

export default function ParentChildAttendancePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId as Id<'students'>;
  const data = useQuery(api.guardian.attendance.getAttendanceForGuardian, {
    studentId,
  });

  if (data === undefined) {
    return <PageSkeleton />;
  }

  if (data.forbidden) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Attendance access restricted"
        description="Your guardian permissions for this child do not include attendance visibility."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.records.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No attendance records" description="Attendance entries will appear here once marked." />
      ) : (
        data.records.slice(0, 60).map((record) => (
          <article key={record._id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-onyx">{record.date}</p>
              <p className="text-xs uppercase text-gray-600">{record.status}</p>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
