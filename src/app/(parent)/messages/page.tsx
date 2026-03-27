'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function ParentMessagesPage() {
  const threads = useQuery(api.messaging.queries.getThreadsForUser);

  if (threads === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Communicate with teachers and school staff." />

      {threads.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="Your message threads will appear here." />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link key={thread._id} href={`/messages/${thread._id}`} className="block rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-onyx">{thread.subject}</p>
                  <p className="mt-1 text-xs text-gray-500">{thread.lastMessagePreview}</p>
                </div>
                {thread.unreadCount > 0 ? (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
