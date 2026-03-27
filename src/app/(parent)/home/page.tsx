'use client';

import { useQuery } from 'convex/react';
import { Users } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { ChildSummaryCard } from '@/components/shared/ChildSummaryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ParentDashboardPage() {
  const data = useQuery(api.guardian.dashboard.getGuardianDashboardData);

  if (data === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Children"
        description="View attendance, fees, and key updates for every linked child from one place."
      />

      {data.children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No linked children"
          description="Your guardian profile has no linked students yet. Contact the school administration for assistance."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.children.map((child) => (
            <ChildSummaryCard
              key={child.student._id}
              studentId={child.student._id}
              name={`${child.student.firstName} ${child.student.lastName}`}
              grade={child.student.currentGradeId ?? null}
              section={child.student.currentSectionId ?? null}
              photoUrl={child.student.avatarUrl ?? null}
              attendanceStatus={child.todayAttendance}
              termBalanceZMW={child.termBalance}
              highlight={child.hasUnreadMessages ? 'Unread messages' : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
