'use client';

import { useQuery } from 'convex/react';
import { Bell } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

export default function StudentNoticesPage() {
  const notices = useQuery(api.students.portal.getStudentNotices);

  if (notices === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        description="Read school updates and operational notices delivered to your student account."
      />

      <SectionCard title="Delivered notices" description="Messages are ordered from newest to oldest.">
        {notices.length === 0 ? (
          <EmptyState icon={Bell} title="No notices delivered" description="When the school sends notices to your account, they will appear here." />
        ) : (
          <div className="space-y-3">
            {notices.sort((a, b) => b.createdAt - a.createdAt).map((notice) => (
              <div key={notice._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-onyx">{notice.title}</p>
                    <p className="mt-1 text-sm text-slate">{notice.body}</p>
                    <p className="mt-2 text-xs text-gray-500">{new Date(notice.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${notice.isRead ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}`}>
                    {notice.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
