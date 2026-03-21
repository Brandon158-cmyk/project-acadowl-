'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Megaphone } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

const TARGET_OPTIONS = [
  { value: 'all_guardians', label: 'All guardians' },
  { value: 'grade_guardians', label: 'Guardians by grade' },
  { value: 'section_guardians', label: 'Guardians by section' },
  { value: 'all_staff', label: 'All staff' },
  { value: 'custom_numbers', label: 'Custom numbers' },
] as const;

export default function AdminComposeBroadcastPage() {
  const [target, setTarget] = useState<(typeof TARGET_OPTIONS)[number]['value']>('all_guardians');
  const [gradeId, setGradeId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [customNumbers, setCustomNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const composerData = useQuery(api.notificationsBroadcast.getBroadcastComposerData);
  const previewArgs = useMemo(() => ({
    target,
    gradeId: target === 'grade_guardians' && gradeId ? gradeId as never : undefined,
    sectionId: target === 'section_guardians' && sectionId ? sectionId as never : undefined,
    customNumbers: target === 'custom_numbers'
      ? customNumbers.split(/[\n,]/).map((value) => value.trim()).filter(Boolean)
      : undefined,
    message,
  }), [customNumbers, gradeId, message, sectionId, target]);
  const preview = useQuery(api.notificationsBroadcast.previewBroadcastRecipients, previewArgs);
  const sendBroadcastSms = useMutation(api.notificationsBroadcast.sendBroadcastSms);

  if (composerData === undefined || preview === undefined) {
    return <PageSkeleton />;
  }

  const characterCount = message.length;
  const smsUnits = Math.max(1, Math.ceil(Math.max(characterCount, 1) / 160));

  const handleSend = async () => {
    setFeedback(null);
    setError(null);
    setIsSending(true);

    try {
      const result = await sendBroadcastSms(previewArgs);
      setFeedback(`Broadcast queued for ${result.recipientCount} recipient${result.recipientCount === 1 ? '' : 's'}. Estimated SMS units: ${result.estimatedCost}.`);
      setMessage('');
      setCustomNumbers('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to queue the broadcast SMS right now.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compose SMS broadcast"
        description="Send school-wide SMS communication to guardians, staff, or custom numbers with recipient preview and balance checks."
      />

      {feedback ? <FeedbackBanner tone="success" title="Broadcast queued" description={feedback} /> : null}
      {error ? <FeedbackBanner tone="error" title="Unable to queue broadcast" description={error} /> : null}
      {!preview.hasSufficientBalance ? (
        <FeedbackBanner tone="warning" title="SMS balance is insufficient" description={`This message needs ${preview.estimatedUnits} units, but only ${composerData.smsBalance} remain.`} />
      ) : null}

      <SectionCard title="Broadcast composer" description="Choose a recipient segment, review the live count preview, and queue your SMS broadcast.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Audience</span>
            <select value={target} onChange={(event) => setTarget(event.target.value as typeof target)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
              {TARGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {target === 'grade_guardians' ? (
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Grade</span>
              <select value={gradeId} onChange={(event) => setGradeId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select a grade</option>
                {composerData.grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>{grade.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          {target === 'section_guardians' ? (
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Section</span>
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select a section</option>
                {composerData.sections.map((section) => (
                  <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
                ))}
              </select>
            </label>
          ) : null}

          {target === 'custom_numbers' ? (
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Custom numbers</span>
              <textarea value={customNumbers} onChange={(event) => setCustomNumbers(event.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" placeholder="Enter one number per line or comma-separated values" />
            </label>
          ) : null}

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" placeholder="Type the SMS message to send" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recipients</p>
            <p className="mt-1 text-lg font-semibold text-onyx">{preview.recipientCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estimated units</p>
            <p className="mt-1 text-lg font-semibold text-onyx">{preview.estimatedUnits}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">SMS balance</p>
            <p className="mt-1 text-lg font-semibold text-onyx">{composerData.smsBalance}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Characters</p>
            <p className="mt-1 text-lg font-semibold text-onyx">{characterCount} / {smsUnits * 160}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate">This action queues SMS immediately and cannot be undone once scheduled.</p>
          <button type="button" onClick={() => void handleSend()} disabled={isSending || !message.trim() || preview.recipientCount === 0 || !preview.hasSufficientBalance} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            Queue broadcast SMS
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Recent broadcast history" description="Recent SMS broadcast records derived from queued notification batches.">
        {composerData.sentHistory.length === 0 ? (
          <p className="text-sm text-slate">No broadcast SMS activity has been recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {composerData.sentHistory.map((entry) => (
              <div key={entry._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-onyx">{entry.title}</p>
                    <p className="mt-1 text-sm text-slate line-clamp-2">{entry.body}</p>
                    <p className="mt-2 text-xs text-gray-500">Batch {entry.relatedEntityId} · {new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.status === 'failed' ? 'bg-red-100 text-red-800' : entry.status === 'queued' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {entry.status ?? 'delivered'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
