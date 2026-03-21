'use client';

import { NotificationCentre } from '@/components/shared/NotificationCentre';

export default function AdminNotificationsPage() {
  return (
    <NotificationCentre
      title="Notices"
      description="Review operational updates, school-wide alerts, and system notices delivered to your admin account."
      sectionTitle="Delivered notices"
      sectionDescription="Messages are ordered from newest to oldest and can be marked as read from this view."
      emptyTitle="No notices delivered"
      emptyDescription="Administrative notices and alerts sent to your account will appear here."
    />
  );
}
