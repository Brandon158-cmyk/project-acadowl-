'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { GraduationCap } from 'lucide-react';

export default function ParentChildResultsPage() {
  const params = useParams<{ studentId: string }>();
  const data = useQuery(api.guardian.results.getResultsForGuardian, {
    studentId: params.studentId as any,
  });

  if (data === undefined) {
    return <PageSkeleton />;
  }

  if (data.forbidden) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Results access restricted"
        description="Your guardian permissions for this child do not include result visibility."
      />
    );
  }

  if (!data.released) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Results not yet available"
        description="This learner's results are not available yet. Please check again later."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Average</p>
        <p className="text-lg font-semibold text-onyx">{data.summary?.averagePercent ?? 0}%</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="space-y-2">
          {data.rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-onyx">{row.subject}</p>
                <p className="text-xs text-gray-500">{row.sessionName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-onyx">{row.grade}</p>
                <p className="text-xs text-gray-600">{row.percent}%</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link href={`/children/${params.studentId}/results/report-cards`} className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700">
        View report cards
      </Link>
    </div>
  );
}
