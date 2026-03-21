'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { CalendarCheck, CheckCircle2, Loader2, Search } from 'lucide-react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';
import { useMe } from '@/hooks/useMe';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type AttendanceFilter = 'all' | AttendanceStatus | 'changed';

const statusOrder: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

function TeacherAttendanceContent() {
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>('all');
  const [statusMap, setStatusMap] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [notesMap, setNotesMap] = useState<Record<string, Record<string, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'pending' | 'synced' | 'failed'>('idle');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { isOnline, queue, queueLength, enqueue, clearQueue, markProcessed, markFailed, isReplaying, setReplayingState } = useOfflineQueue();
  const registerContext = useQuery(api.attendance.queries.getTeacherRegisterContext);
  const effectiveSectionId = selectedSectionId || registerContext?.sections[0]?._id || '';
  const registerScopeKey = `${effectiveSectionId}:${selectedDate}`;
  const register = useQuery(
    api.attendance.queries.getRegisterForSection,
    effectiveSectionId ? { sectionId: effectiveSectionId as Id<'sections'>, date: selectedDate } : 'skip',
  );
  const markBulkAttendance = useMutation(api.attendance.mutations.markBulkAttendance);

  const latestQueueError = useMemo(() => {
    return [...queue].reverse().find((item) => item.lastError)?.lastError ?? null;
  }, [queue]);
  const failedQueueCount = queue.filter((item) => Boolean(item.lastError)).length;
  const currentStatusMap = statusMap[registerScopeKey] ?? {};
  const currentNotesMap = notesMap[registerScopeKey] ?? {};

  const replayQueuedAttendance = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isReplaying) {
      return;
    }

    setReplayingState(true);
    setSyncState('pending');

    for (const item of queue) {
      try {
        if (item.mutationFn === 'attendance.markBulkAttendance') {
          await markBulkAttendance({
            sectionId: item.args.sectionId as Id<'sections'>,
            date: item.args.date as string,
            records: item.args.records as {
              studentId: Id<'students'>;
              status: AttendanceStatus;
              notes?: string;
              clientId?: string;
            }[],
          });
          markProcessed(item.id);
        }
      } catch (error) {
        markFailed(item.id, error instanceof Error ? error.message : 'Sync failed');
        setSyncState('failed');
        setReplayingState(false);
        return;
      }
    }

    setReplayingState(false);
    setSyncState('synced');
    setMessage('All pending attendance records have been synced successfully.');
  }, [isOnline, isReplaying, markBulkAttendance, markFailed, markProcessed, queue, setReplayingState]);

  useEffect(() => {
    if (!isOnline || queue.length === 0 || isReplaying) {
      return;
    }

    let cancelled = false;

    const replayQueue = async () => {
      if (cancelled) {
        return;
      }

      await replayQueuedAttendance();
    };

    void replayQueue();

    return () => {
      cancelled = true;
    };
  }, [isOnline, isReplaying, queue, replayQueuedAttendance]);

  useEffect(() => {
    if (syncState === 'synced') {
      const timer = window.setTimeout(() => setSyncState('idle'), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [syncState]);

  if (registerContext === undefined) {
    return <PageSkeleton />;
  }

  const pendingStudentIds = new Set(
    queue
      .filter((item) => item.mutationFn === 'attendance.markBulkAttendance')
      .flatMap((item) => {
        const itemSectionId = item.args.sectionId as string | undefined;
        const itemDate = item.args.date as string | undefined;
        if (itemSectionId !== effectiveSectionId || itemDate !== selectedDate) {
          return [];
        }

        const records = item.args.records as { studentId: string }[] | undefined;
        return records?.map((record) => record.studentId) ?? [];
      }),
  );
  const scopedQueueCount = queue.filter((item) => {
    const itemSectionId = item.args.sectionId as string | undefined;
    const itemDate = item.args.date as string | undefined;
    return item.mutationFn === 'attendance.markBulkAttendance' && itemSectionId === effectiveSectionId && itemDate === selectedDate;
  }).length;
  const selectedSection = registerContext.sections.find((section) => section._id === effectiveSectionId) ?? null;

  const getStatusForStudent = (studentId: string) => {
    if (currentStatusMap[studentId]) {
      return currentStatusMap[studentId];
    }

    const student = register?.roster.find((entry) => entry._id === studentId);
    return (student?.attendance?.status as AttendanceStatus | undefined) ?? 'present';
  };

  const getNotesForStudent = (studentId: string) => {
    if (currentNotesMap[studentId] !== undefined) {
      return currentNotesMap[studentId];
    }

    const student = register?.roster.find((entry) => entry._id === studentId);
    return student?.attendance?.notes ?? '';
  };

  const hasLocalChange = (studentId: string) => {
    const student = register?.roster.find((entry) => entry._id === studentId);
    const persistedStatus = (student?.attendance?.status as AttendanceStatus | undefined) ?? 'present';
    const persistedNotes = student?.attendance?.notes ?? '';
    return getStatusForStudent(studentId) !== persistedStatus || getNotesForStudent(studentId) !== persistedNotes;
  };

  const filteredRoster = (register?.roster ?? []).filter((student) => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.studentNumber}`.toLowerCase().includes(search.trim().toLowerCase());
    if (!matchesSearch) {
      return false;
    }

    if (statusFilter === 'all') {
      return true;
    }

    if (statusFilter === 'changed') {
      return hasLocalChange(student._id);
    }

    return getStatusForStudent(student._id) === statusFilter;
  });
  const totalRosterCount = register?.roster.length ?? 0;
  const hasSearchOrFilter = search.trim().length > 0 || statusFilter !== 'all';

  const counts = filteredRoster.reduce(
    (summary, student) => {
      const status = getStatusForStudent(student._id);
      summary[status] += 1;
      return summary;
    },
    { present: 0, absent: 0, late: 0, excused: 0 },
  );
  const reviewedCount = filteredRoster.filter((student) => hasLocalChange(student._id) || student.attendance !== null).length;
  const remainingCount = Math.max(filteredRoster.length - reviewedCount, 0);
  const activeFilterLabel = statusFilter === 'all' ? 'All learners' : statusFilter === 'changed' ? 'Unsaved changes' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [registerScopeKey]: {
        ...(prev[registerScopeKey] ?? {}),
        [studentId]: status,
      },
    }));
  };

  const markAllPresent = () => {
    if (!register?.roster) return;
    const next: Record<string, AttendanceStatus> = {};
    register.roster.forEach((student) => {
      next[student._id] = 'present';
    });
    setStatusMap((prev) => ({
      ...prev,
      [registerScopeKey]: next,
    }));
  };

  const clearDraft = () => {
    setStatusMap((prev) => {
      const next = { ...prev };
      delete next[registerScopeKey];
      return next;
    });
    setNotesMap((prev) => {
      const next = { ...prev };
      delete next[registerScopeKey];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!effectiveSectionId || !register?.roster) return;
    setMessage(null);
    const sectionLabel = selectedSection?.displayName ?? selectedSection?.name ?? 'Selected section';
    const records = register.roster.map((student) => ({
      studentId: student._id,
      status: getStatusForStudent(student._id),
      notes: getNotesForStudent(student._id) || undefined,
      clientId: crypto.randomUUID(),
    }));

    if (!isOnline) {
      enqueue('attendance.markBulkAttendance', {
        sectionId: effectiveSectionId,
        date: selectedDate,
        records,
      });
      setSyncState('pending');
      setMessage(`Attendance for ${sectionLabel} on ${selectedDate} has been saved offline and will sync when connectivity is restored.`);
      return;
    }

    await markBulkAttendance({
      sectionId: effectiveSectionId as Id<'sections'>,
      date: selectedDate,
      records,
    });
    if (queueLength > 0) {
      clearQueue();
    }
    setSyncState('synced');
    setMessage(`Attendance for ${sectionLabel} on ${selectedDate} has been saved successfully.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Register"
        description="Mark attendance for your assigned class sections with offline-aware handling and clear roster visibility."
      />

      {message ? <FeedbackBanner tone="success" title="Register updated" description={message} /> : null}
      {!isOnline ? <FeedbackBanner tone="warning" title="You are offline" description={`Pending sync queue: ${queueLength} item${queueLength === 1 ? '' : 's'}. New attendance will be stored locally until connectivity returns.`} /> : null}
      {isOnline && (queueLength > 0 || isReplaying) ? <FeedbackBanner tone="warning" title="Attendance sync pending" description={`${queueLength} queued item${queueLength === 1 ? '' : 's'} waiting to sync.`} /> : null}
      {isOnline && syncState === 'synced' ? <FeedbackBanner tone="success" title="Attendance synced" description="All queued attendance records are now synced." /> : null}
      {syncState === 'failed' ? <FeedbackBanner tone="error" title="Sync failed" description={latestQueueError ?? 'A queued attendance record could not be synced.'} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Available sections" value={String(registerContext.sections.length)} helper="Sections you can mark attendance for" icon={CalendarCheck} />
        <MetricCard label="Queue pending" value={String(queueLength)} helper={isReplaying ? 'Sync currently in progress' : failedQueueCount > 0 ? `${failedQueueCount} queued item${failedQueueCount === 1 ? '' : 's'} need retry` : 'Offline attendance submissions waiting to sync'} icon={CheckCircle2} />
        <MetricCard label="Present" value={String(counts.present)} helper="Current selection present count" icon={CheckCircle2} />
        <MetricCard label="Absent" value={String(counts.absent)} helper="Current selection absent count" icon={CalendarCheck} />
      </div>

      {failedQueueCount > 0 ? (
        <div className="flex justify-end">
          <button type="button" onClick={() => void replayQueuedAttendance()} disabled={!isOnline || isReplaying} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
            {isReplaying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Retry failed sync
          </button>
        </div>
      ) : null}

      {effectiveSectionId ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Selected section</p>
            <p className="mt-2 font-serif text-xl font-semibold text-onyx">{selectedSection?.displayName ?? selectedSection?.name ?? 'Unknown section'}</p>
            <p className="mt-1 text-sm text-slate">{selectedDate}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Late learners</p>
            <p className="mt-2 font-serif text-xl font-semibold text-onyx">{counts.late}</p>
            <p className="mt-1 text-sm text-slate">Learners marked late for this register.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Excused learners</p>
            <p className="mt-2 font-serif text-xl font-semibold text-onyx">{counts.excused}</p>
            <p className="mt-1 text-sm text-slate">Learners excused from class attendance.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Roster in view</p>
            <p className="mt-2 font-serif text-xl font-semibold text-onyx">{filteredRoster.length}</p>
            <p className="mt-1 text-sm text-slate">Learners currently visible after search filtering.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Queued for this register</p>
            <p className="mt-2 font-serif text-xl font-semibold text-onyx">{scopedQueueCount}</p>
            <p className="mt-1 text-sm text-slate">Offline attendance items tied to the current section and date.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Register review progress</p>
                <p className="mt-2 font-serif text-xl font-semibold text-onyx">{reviewedCount} of {filteredRoster.length} learners reviewed</p>
                <p className="mt-1 text-sm text-slate">{remainingCount === 0 ? 'All visible learners have either saved attendance or local updates ready to submit.' : `${remainingCount} learner${remainingCount === 1 ? '' : 's'} still need review in the current filtered roster.`}</p>
              </div>
              <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-school-primary transition-all duration-300" style={{ width: filteredRoster.length === 0 ? '0%' : `${(reviewedCount / filteredRoster.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard title="Register controls" description="Choose a section, search the roster, and update the daily attendance register.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label htmlFor="sectionId" className="mb-1 block text-sm font-medium text-gray-700">Section</label>
            <select id="sectionId" value={effectiveSectionId} onChange={(event) => setSelectedSectionId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
              <option value="">Select section</option>
              {registerContext.sections.map((section) => (
                <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="selectedDate" className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input id="selectedDate" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
          </div>
          <div>
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700">Search learner</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or student number" className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </div>
          </div>
          <div>
            <label htmlFor="statusFilter" className="mb-1 block text-sm font-medium text-gray-700">Filter by status</label>
            <select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceFilter)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
              <option value="all">All learners</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="changed">Unsaved changes</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={clearDraft} disabled={!effectiveSectionId} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              Clear draft
            </button>
            <button type="button" onClick={markAllPresent} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95">
              Mark all present
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Daily register" description={`Attendance for ${selectedDate}. Choose the correct status directly for each learner.`}>
        {!effectiveSectionId ? (
          <EmptyState icon={CalendarCheck} title="No section selected" description="Choose a section to load its attendance register." />
        ) : register === undefined ? (
          <PageSkeleton />
        ) : filteredRoster.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={totalRosterCount === 0 ? 'No learners in this register' : 'No learners match the current view'}
            description={totalRosterCount === 0 ? 'This section has no roster yet for the selected date.' : hasSearchOrFilter ? 'Adjust the search text or status filter to show more learners.' : 'There are no learners available to display for this register.'}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active roster view</p>
                <p className="mt-1 text-sm font-medium text-onyx">{activeFilterLabel}</p>
              </div>
              <p className="text-sm text-slate">Showing {filteredRoster.length} learner{filteredRoster.length === 1 ? '' : 's'} for the current search and status filter.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Current status</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Notes</th>
                      <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Status actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRoster.map((student) => {
                      const status = getStatusForStudent(student._id);
                      return (
                        <tr key={student._id} className="transition-colors hover:bg-gray-50/50">
                          <td className="p-4">
                            <p className="font-medium text-onyx">{student.firstName} {student.lastName}</p>
                            <p className="mt-1 font-mono text-xs text-gray-500">{student.studentNumber}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-800">{status}</span>
                              {pendingStudentIds.has(student._id) ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Pending sync</span> : null}
                              {hasLocalChange(student._id) ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">Unsaved change</span> : null}
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={getNotesForStudent(student._id)}
                              onChange={(event) =>
                                setNotesMap((prev) => ({
                                  ...prev,
                                  [registerScopeKey]: {
                                    ...(prev[registerScopeKey] ?? {}),
                                    [student._id]: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Optional note"
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
                            />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {statusOrder.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => setStudentStatus(student._id, option)}
                                  className={status === option ? 'rounded-lg bg-school-primary px-3 py-2 text-xs font-medium uppercase tracking-wide text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95' : 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95'}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <button type="button" onClick={() => void handleSubmit()} disabled={!effectiveSectionId || isReplaying} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {isReplaying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit register
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default function TeacherAttendancePage() {
  const { user, isLoading } = useMe();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!user?.staffId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Attendance Register"
          description="Mark attendance for your assigned class sections with offline-aware handling and clear roster visibility."
        />
        <FeedbackBanner
          tone="warning"
          title="Your account is not linked to a teaching staff profile"
          description="A school administrator needs to link your user account to a staff record before attendance registers can appear here."
        />
        <SectionCard title="Attendance access" description="Once your staff profile is linked, your assigned sections and register controls will appear here.">
          <EmptyState
            icon={CalendarCheck}
            title="No teaching profile linked"
            description="Ask a school administrator to connect your account to the correct staff record."
          />
        </SectionCard>
      </div>
    );
  }

  return <TeacherAttendanceContent />;
}
