'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { BookOpen, Plus, Lock, Unlock, Loader2 } from 'lucide-react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  class_test: 'Class Test',
  mid_term: 'Mid-Term',
  end_of_term: 'End of Term',
  mock: 'Mock',
  ecz_final: 'ECZ Final',
};

export default function ExamsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const sessions = useQuery(api.schools.examQueries.listExamSessions, {});
  const toggleLock = useMutation(api.schools.examMutations.toggleExamSessionLock);
  const [lockingId, setLockingId] = useState<string | null>(null);

  const handleToggleLock = useCallback(async (sessionId: Id<'examSessions'>) => {
    setLockingId(sessionId);
    try {
      const result = await toggleLock({ sessionId });
      toast.success(result.isLocked ? 'Session locked' : 'Session unlocked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle lock');
    } finally {
      setLockingId(null);
    }
  }, [toggleLock]);

  if (sessions === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Manage exam sessions, schedule exams, and control result entry."
        actions={
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Exam Session
          </button>
        }
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {sessions.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No exam sessions"
            description="Create your first exam session to begin managing results."
            action={
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
              >
                <Plus className="h-4 w-4" />
                New Exam Session
              </button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Term</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.map((session) => (
                    <tr key={session._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="p-4 font-medium text-gray-900">{session.name}</td>
                      <td className="p-4 text-sm text-gray-600">{TYPE_LABELS[session.type] ?? session.type}</td>
                      <td className="p-4 text-sm text-gray-600">{session.termName}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          session.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-success/10 text-success'
                        }`}>
                          {session.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {session.isLocked ? 'Locked' : 'Open'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={lockingId === session._id}
                          onClick={() => handleToggleLock(session._id)}
                          className="text-sm font-medium text-school-primary hover:text-crimson-dark disabled:opacity-50"
                        >
                          {lockingId === session._id ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                          ) : session.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500">
              <span>Showing {sessions.length} exam session{sessions.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}
      </section>

      {showCreateForm && <CreateExamSessionDialog onClose={() => setShowCreateForm(false)} />}
    </div>
  );
}

function CreateExamSessionDialog({ onClose }: { onClose: () => void }) {
  const createSession = useMutation(api.schools.examMutations.createExamSession);
  const [saving, setSaving] = useState(false);

  // We need terms list — fetch from academic years
  const academicData = useQuery(api.students.queries.getEnrollmentFormData);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      await createSession({
        name: form.get('name') as string,
        termId: form.get('termId') as Id<'terms'>,
        type: form.get('type') as 'class_test',
      });
      toast.success('Exam session created');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create exam session');
    } finally {
      setSaving(false);
    }
  }, [createSession, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl font-semibold text-onyx">New Exam Session</h2>
        <p className="mt-1 text-sm text-slate">Create a new exam session for a term.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Session Name *</span>
            <input
              name="name"
              required
              placeholder="e.g. Mid-Term 1 2025"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Type *</span>
            <select
              name="type"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Term *</span>
            <select
              name="termId"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">Select a term</option>
              {academicData?.terms?.map((term: { _id: string; name: string }) => (
                <option key={term._id} value={term._id}>{term.name}</option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating…' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
