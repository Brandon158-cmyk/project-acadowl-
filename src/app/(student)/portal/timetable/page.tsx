'use client';

import { useQuery } from 'convex/react';
import { Calendar } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function StudentTimetablePage() {
  const dashboard = useQuery(api.students.portal.getStudentDashboard);

  if (dashboard === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Review your current timetable based on your active section placement."
      />

      <SectionCard title="Weekly schedule" description="Timetable slots are grouped by configured day order.">
        {dashboard.timetableSlots.length === 0 ? (
          <EmptyState icon={Calendar} title="No timetable configured" description="Once the school timetable is prepared for your section, it will appear here." />
        ) : (
          <div className="space-y-3">
            {dashboard.timetableSlots.map((slot) => (
              <div key={slot._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-onyx">Day {slot.dayOfWeek + 1}</p>
                    <p className="mt-1 text-sm text-slate">{slot.startTime} - {slot.endTime}</p>
                  </div>
                  <p className="text-sm text-slate">{slot.room ?? 'Room to be assigned'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
