'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/../convex/_generated/api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ParentMessageThreadPage() {
  const params = useParams<{ threadId: string }>();
  const [body, setBody] = useState('');

  const messages = useQuery(api.messaging.queries.getMessagesForThread, {
    threadId: params.threadId as any,
  });
  const sendMessage = useMutation(api.messaging.threads.sendMessage);

  if (messages === undefined) {
    return <PageSkeleton />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;

    await sendMessage({
      threadId: params.threadId as any,
      body: body.trim(),
    });

    setBody('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {messages.map((message) => (
          <div key={message._id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <p className="font-medium text-onyx">{message.sender?.name ?? 'Unknown sender'}</p>
            <p className="mt-1 text-gray-700">{message.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-16 rounded-xl border border-gray-200 bg-white p-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Type your message..."
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="mt-2 rounded-lg bg-school-primary px-4 py-2 text-sm font-medium text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
