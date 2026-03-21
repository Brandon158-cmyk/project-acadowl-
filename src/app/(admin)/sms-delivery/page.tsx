'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { MessageSquare, CheckCircle, XCircle, Clock, Wifi } from 'lucide-react';

const STATUS_CLASSES: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  queued: 'bg-amber-100 text-amber-800',
};

const STATUS_LABEL: Record<string, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  failed: 'Failed',
  queued: 'Queued',
};

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString('en-ZM', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SmsDeliveryPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const data = useQuery(api.notifications.getSmsDeliveryReport, { limit: 200 });

  if (data === undefined) return <PageSkeleton />;

  const { messages, totals } = data;

  const filtered = filterStatus === 'all'
    ? messages
    : messages.filter((m) => {
        const s = m.status ?? 'queued';
        if (filterStatus === 'sent') return s === 'sent' || s === 'delivered';
        return s === filterStatus;
      });

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Delivery Report"
        description="Monitor outbound SMS messages, delivery statuses, and provider activity."
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Sent" value={String(totals.total)} helper="All SMS dispatched" icon={MessageSquare} />
        <MetricCard label="Delivered" value={String(totals.sent)} helper="Sent or delivered" icon={CheckCircle} />
        <MetricCard label="Failed" value={String(totals.failed)} helper="All providers failed" icon={XCircle} />
        <MetricCard label="Queued" value={String(totals.queued)} helper="Awaiting dispatch" icon={Clock} />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">By Provider</p>
          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{totals.airtel}</p>
              <p className="mt-0.5 text-xs text-blue-600">Airtel</p>
            </div>
            <div className="flex-1 rounded-xl bg-yellow-50 p-3 text-center">
              <p className="text-xl font-bold text-yellow-700">{totals.mtn}</p>
              <p className="mt-0.5 text-xs text-yellow-600">MTN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'sent', 'failed', 'queued'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-school-primary text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">
                {s === 'sent' ? totals.sent : s === 'failed' ? totals.failed : totals.queued}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Wifi className="h-10 w-10 opacity-30" />
            <p className="text-sm">No SMS messages found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Recipient</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Provider</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Retries</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((msg) => {
                  const status = msg.status ?? 'queued';
                  return (
                    <tr key={msg._id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-3 text-gray-800 font-medium">
                        {msg.recipientPhone ?? '—'}
                      </td>
                      <td className="px-6 py-3 capitalize text-gray-600">{msg.type}</td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                      <td className="px-6 py-3 capitalize text-gray-600">
                        {msg.provider ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{msg.retryCount ?? 0}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{formatTimestamp(msg.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
