'use client';

import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { AlertCircle } from 'lucide-react';

export default function ParentChildOverviewPage() {
  const params = useParams<{ studentId: string }>();
  const data = useQuery(api.guardian.dashboard.getChildOverviewForGuardian, {
    studentId: params.studentId as any,
  });

  if (data === undefined) {
    return <PageSkeleton />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No overview available"
        description="We could not load this learner summary right now."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Today's Status</p>
        <p className="mt-1 text-base font-semibold text-onyx">
          {data.todayAttendance ? data.todayAttendance.status : 'Attendance not yet marked'}
        </p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">This Term</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Attendance</p>
            <p className="font-semibold">{data.currentTermAttendancePercent}%</p>
          </div>
          <div>
            <p className="text-gray-500">Fee balance</p>
            <p className="font-semibold">{data.feeBalance ? `ZMW ${data.feeBalance.outstanding}` : 'No fee access'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Recent Activity</p>
        <div className="mt-2 space-y-2">
          {data.recentNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">No recent notifications.</p>
          ) : (
            data.recentNotifications.map((item) => (
              <div key={item._id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-gray-600">{item.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
