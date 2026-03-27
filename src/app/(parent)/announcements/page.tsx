'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';

export default function ParentAnnouncementsPage() {
  const data = useQuery(api.guardian.announcements.getAnnouncementsForGuardian, {});

  if (data === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Announcements" description="Latest school communications for guardians." />
      <div className="space-y-3">
        {data.items.map((item) => (
          <article key={item._id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
              {item.isPinned ? <Badge className="text-xs">Pinned</Badge> : null}
            </div>
            <p className="mt-2 text-sm font-semibold text-onyx">{item.title}</p>
            <p className="mt-1 text-sm text-gray-700">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
