'use client';

import { NotificationCentre } from '@/components/shared/NotificationCentre';

export default function TeacherNoticesPage() {
  return (
    <NotificationCentre
      title="Notices"
      description="Review classroom alerts, timetable updates, and school communications delivered to your teacher account."
      sectionTitle="Delivered notices"
      sectionDescription="Messages are ordered from newest to oldest and can be marked as read from this view."
      emptyTitle="No notices delivered"
      emptyDescription="Teacher notices and operational updates sent to your account will appear here."
    />
  );
}
