'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ParentNotificationsPage() {
  const feed = useQuery(api.guardian.notifications.getNotificationsForGuardian, {});
  const markAll = useMutation(api.guardian.notifications.markAllNotificationsAsRead);

  if (feed === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Notifications" description="History of alerts and school updates." />
        <button
          type="button"
          onClick={() => markAll({})}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
        >
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {feed.items.map((item) => (
          <article
            key={item._id}
            className={`rounded-xl border p-4 ${item.isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
          >
            <p className="text-sm font-semibold text-onyx">{item.title}</p>
            <p className="mt-1 text-sm text-gray-700">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
