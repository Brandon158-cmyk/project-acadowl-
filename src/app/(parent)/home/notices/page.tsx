'use client';

import { useQuery } from 'convex/react';
import { Bell } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';

export default function ParentNoticesPage() {
  const data = useQuery(api.guardian.announcements.getAnnouncementsForGuardian, {});

  if (data === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notices"
        description="Review school communications delivered to your guardian account."
      />

      {data.items.length === 0 ? (
        <EmptyState icon={Bell} title="No notices delivered" description="When the school sends updates to your account, they will appear in this view." />
      ) : (
        <div className="space-y-3">
          {data.items.map((notice) => (
            <article key={notice._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {notice.category}
                </Badge>
                {notice.isPinned ? <Badge className="text-xs">Pinned</Badge> : null}
              </div>
              <p className="mt-2 font-medium text-onyx">{notice.title}</p>
              <p className="mt-1 text-sm text-slate">{notice.body}</p>
              <p className="mt-2 text-xs text-gray-500">
                {new Date(notice.publishedAt ?? notice.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
