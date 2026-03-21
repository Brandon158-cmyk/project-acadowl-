'use client';

import { NotificationCentre } from '@/components/shared/NotificationCentre';

export default function DriverNoticesPage() {
  return (
    <NotificationCentre
      title="Notices"
      description="Review route instructions, transport alerts, and operational notices delivered to your driver account."
      sectionTitle="Delivered notices"
      sectionDescription="Messages are ordered from newest to oldest and can be marked as read from this view."
      emptyTitle="No notices delivered"
      emptyDescription="Transport notices and route updates sent to your account will appear here."
    />
  );
}
