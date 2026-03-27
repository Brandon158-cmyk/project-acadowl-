'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

type PrefKey =
  | 'attendanceAbsent'
  | 'attendanceLate'
  | 'resultsReleased'
  | 'feeInvoiceGenerated'
  | 'feeReminder'
  | 'feePaymentConfirmed'
  | 'homeworkAssigned'
  | 'newMessage'
  | 'schoolAnnouncement'
  | 'weeklyDigest';

const prefOrder: Array<{ key: PrefKey; label: string }> = [
  { key: 'attendanceAbsent', label: 'Attendance absent alerts' },
  { key: 'attendanceLate', label: 'Attendance late alerts' },
  { key: 'resultsReleased', label: 'Results released' },
  { key: 'feeInvoiceGenerated', label: 'Invoice generated' },
  { key: 'feeReminder', label: 'Fee reminders' },
  { key: 'feePaymentConfirmed', label: 'Payment confirmations' },
  { key: 'homeworkAssigned', label: 'Homework assigned' },
  { key: 'newMessage', label: 'New messages' },
  { key: 'schoolAnnouncement', label: 'School announcements' },
  { key: 'weeklyDigest', label: 'Weekly digest' },
];

export default function ParentNotificationPreferencesPage() {
  const preferences = useQuery(api.guardian.preferences.getNotificationPreferences);
  const updatePreferences = useMutation(api.guardian.preferences.updateNotificationPreferences);

  const effectivePreferences = useMemo(() => preferences, [preferences]);

  if (effectivePreferences === undefined) {
    return <PageSkeleton />;
  }

  const onToggle = async (key: PrefKey) => {
    await updatePreferences({
      preferences: {
        ...effectivePreferences,
        [key]: !effectivePreferences[key],
      },
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notification Preferences"
        description="Control how and when you receive guardian alerts."
      />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="space-y-3">
          {prefOrder.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggle(item.key)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left"
            >
              <span className="text-sm text-onyx">{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${effectivePreferences[item.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {effectivePreferences[item.key] ? 'On' : 'Off'}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
