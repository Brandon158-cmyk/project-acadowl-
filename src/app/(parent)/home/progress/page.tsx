'use client';

import { useQuery } from 'convex/react';
import { BookOpen } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function ParentProgressPage() {
  const progress = useQuery(api.students.portal.getParentChildProgress);

  if (progress === undefined) {
    return <PageSkeleton />;
  }

  const averageAcrossChildren = progress.length > 0
    ? progress.reduce((sum, entry) => sum + (entry.examAverage ?? 0), 0) / progress.length
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Child Progress"
        description="Review academic performance indicators, recent exam averages, and current class placement for each linked learner."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Children tracked" value={String(progress.length)} helper="Linked learners included in this progress view" icon={BookOpen} />
        <MetricCard label="Average performance" value={averageAcrossChildren === null ? '—' : `${averageAcrossChildren.toFixed(1)}%`} helper="Mean recorded exam average across linked learners" icon={BookOpen} />
      </div>

      <SectionCard title="Academic standing" description="Each learner's current placement and recorded performance are shown below.">
        {progress.length === 0 ? (
          <EmptyState icon={BookOpen} title="No progress records available" description="Linked learner progress will appear here once student records and exam results are available." />
        ) : (
          <div className="space-y-4">
            {progress.map((entry) => (
              <div key={entry.student._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-onyx">{entry.student.firstName} {entry.student.lastName}</p>
                    <p className="mt-1 text-sm text-slate">{entry.grade?.name ?? 'Unassigned grade'} · {entry.section?.displayName ?? entry.section?.name ?? 'Unassigned section'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Exam average</p>
                    <p className="mt-1 font-serif text-2xl font-semibold text-onyx">{entry.examAverage === null ? '—' : `${entry.examAverage.toFixed(1)}%`}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Academic year</p>
                    <p className="mt-2 text-sm text-onyx">{entry.currentAcademicYear?.name ?? 'Not active'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current term</p>
                    <p className="mt-2 text-sm text-onyx">{entry.currentTerm?.name ?? 'Not active'}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recorded results</p>
                    <p className="mt-2 text-sm text-onyx">{entry.examResults.length} result entries</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
