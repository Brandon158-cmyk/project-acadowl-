'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function ParentChildMessagesPage() {
  const params = useParams<{ studentId: string }>();
  const threads = useQuery(api.messaging.queries.getThreadsForUser);

  if (threads === undefined) {
    return null;
  }

  const studentThreads = threads.filter((thread) => thread.studentId === (params.studentId as any));

  if (studentThreads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages for this child"
        description="Start a message from the main Messages page to create a thread for this learner."
      />
    );
  }

  return (
    <div className="space-y-3">
      {studentThreads.map((thread) => (
        <Link key={thread._id} href={`/messages/${thread._id}`} className="block rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-onyx">{thread.subject}</p>
          <p className="mt-1 text-xs text-gray-500">{thread.lastMessagePreview}</p>
        </Link>
      ))}
    </div>
  );
}
