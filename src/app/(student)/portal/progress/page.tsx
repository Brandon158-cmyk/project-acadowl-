'use client';

import { useQuery } from 'convex/react';
import { BookOpen } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function StudentProgressPage() {
  const dashboard = useQuery(api.students.portal.getStudentDashboard);

  if (dashboard === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="Review your current academic standing and recorded examination performance."
      />

      <SectionCard title="Performance summary" description="Your recorded result entries and academic placement are shown below.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Exam average</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.examAverage === null ? '—' : `${dashboard.examAverage.toFixed(1)}%`}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recorded results</p>
            <p className="mt-2 font-serif text-3xl font-semibold text-onyx">{dashboard.examResults.length}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Result entries" description="This view lists the currently recorded exam results linked to your student profile.">
        {dashboard.examResults.length === 0 ? (
          <EmptyState icon={BookOpen} title="No exam results recorded" description="Once teachers enter and publish exam results, they will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Marks</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Grade</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Percent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboard.examResults.map((result) => (
                    <tr key={result._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="p-4 text-sm text-onyx">{result.marksObtained}/{result.maxMarks}</td>
                      <td className="p-4 text-sm text-slate">{result.grade ?? '—'}</td>
                      <td className="p-4 text-right text-sm text-onyx">{((result.marksObtained / result.maxMarks) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
