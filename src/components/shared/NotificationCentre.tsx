'use client';

import { useMutation, useQuery } from 'convex/react';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

interface NotificationCentreProps {
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
  emptyTitle: string;
  emptyDescription: string;
}

export function NotificationCentre({
  title,
  description,
  sectionTitle,
  sectionDescription,
  emptyTitle,
  emptyDescription,
}: NotificationCentreProps) {
  const notifications = useQuery(api.notifications.getMyNotifications, { limit: 50 });
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (notifications === undefined || unreadCount === undefined) {
    return <PageSkeleton />;
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleMarkAsRead = async (notificationId: Id<'notifications'>, isRead: boolean) => {
    if (isRead) {
      return;
    }

    await markAsRead({ notificationId });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-semibold text-onyx">{title}</h1>
            <p className="max-w-3xl text-sm text-slate">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              {unreadCount} unread
            </span>
            <button
              type="button"
              onClick={() => void handleMarkAllAsRead()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-onyx shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          </div>
        </div>
      </div>

      {unreadCount > 0 ? (
        <FeedbackBanner
          tone="info"
          title="Unread notifications available"
          description={`You have ${unreadCount} notification${unreadCount === 1 ? '' : 's'} awaiting review.`}
        />
      ) : null}

      <SectionCard title={sectionTitle} description={sectionDescription}>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="space-y-3">
            {notifications.map((notice) => (
              <button
                key={notice._id}
                type="button"
                onClick={() => void handleMarkAsRead(notice._id, notice.isRead)}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-onyx">{notice.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${notice.isRead ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}`}>
                        {notice.isRead ? 'Read' : 'Unread'}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-800">
                        {notice.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate">{notice.body}</p>
                    <p className="text-xs text-gray-500">{new Date(notice.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
