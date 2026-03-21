'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, BookOpen, Loader2, Phone, Mail, UserCircle } from 'lucide-react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId as Id<'students'>;
  const [message, setMessage] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState('');
  const profile = useQuery(api.students.queries.getStudentProfile, { studentId });
  const enrollmentData = useQuery(api.students.queries.getEnrollmentFormData);
  const transferStudentSection = useMutation(api.students.mutations.transferStudentSection);

  if (profile === undefined || enrollmentData === undefined) {
    return <PageSkeleton />;
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">The requested student record could not be found.</p>
      </div>
    );
  }

  const { student, grade, section, guardians, sectionHistory, attendanceSummary, examAverage, recentSessions } = profile;
  const sameGradeSections = enrollmentData.sections.filter(
    (entry) => entry.gradeId === student.currentGradeId && entry._id !== student.currentSectionId,
  );

  const handleTransfer = async () => {
    if (!student.currentGradeId || !targetSectionId) return;
    setMessage(null);
    await transferStudentSection({
      studentId,
      gradeId: student.currentGradeId,
      sectionId: targetSectionId as Id<'sections'>,
      reason: 'Section transfer',
    });
    setTargetSectionId('');
    setMessage('The student section transfer has been saved successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`Student number ${student.studentNumber}`}
        actions={
          <Link
            href="/students"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to students
          </Link>
        }
      />

      <FeedbackBanner
        tone="info"
        title="Student lifecycle profile"
        description="This view combines placement, guardian links, attendance indicators, and recorded academic history for the selected student."
      />

      {message ? <FeedbackBanner tone="success" title="Student record updated" description={message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Attendance marks" value={String(attendanceSummary.total)} helper="Recorded entries for this student" icon={BookOpen} />
        <MetricCard label="Exam average" value={examAverage === null ? '—' : `${examAverage.toFixed(1)}%`} helper="Based on recorded exam results" icon={BookOpen} />
        <MetricCard label="Guardians linked" value={String(guardians.length)} helper="Guardian relationships on file" icon={UserCircle} />
        <MetricCard label="Section history" value={String(sectionHistory.length)} helper="Placement records captured so far" icon={BookOpen} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-onyx">Profile summary</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current grade</p>
                <p className="mt-1 text-sm text-gray-800">{grade?.name ?? 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current section</p>
                <p className="mt-1 text-sm text-gray-800">{section?.displayName ?? section?.name ?? 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  student.enrollmentStatus === 'active' ? 'bg-success/10 text-success' :
                  student.enrollmentStatus === 'suspended' ? 'bg-amber-100 text-amber-800' :
                  ['expelled', 'withdrawn'].includes(student.enrollmentStatus) ? 'bg-error/10 text-error' :
                  'bg-info/10 text-info'
                }`}>{student.enrollmentStatus.replace('_', ' ')}</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date of birth</p>
                <p className="mt-1 text-sm text-gray-800">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-800">{student.email ?? 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-gray-800">{student.phone ?? 'Not provided'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <label htmlFor="targetSectionId" className="mb-1 block text-sm font-medium text-gray-700">Change section</label>
                  <select id="targetSectionId" value={targetSectionId} onChange={(event) => setTargetSectionId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                    <option value="">Select another section in this grade</option>
                    {sameGradeSections.map((entry) => (
                      <option key={entry._id} value={entry._id}>{entry.displayName ?? entry.name}</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => void handleTransfer()} disabled={!targetSectionId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
                  <Loader2 className="hidden h-4 w-4 animate-spin" />
                  Transfer section
                </button>
              </div>
              {sameGradeSections.length === 0 ? <p className="mt-3 text-sm text-slate">No other sections are currently available in this grade for transfer.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-onyx">Guardians</h2>
            <div className="mt-6 space-y-4">
              {guardians.map((guardian) => (
                <div key={guardian._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                      <p className="text-sm capitalize text-gray-600">{guardian.relationship}{guardian.isPrimary ? ' · Primary contact' : ''}</p>
                    </div>
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{guardian.phone}</p>
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{guardian.email ?? 'No email recorded'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-onyx">Academic indicators</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attendance records</p>
                <p className="mt-2 text-2xl font-semibold text-onyx">{attendanceSummary.total}</p>
                <p className="mt-1 text-sm text-gray-600">{attendanceSummary.present} present · {attendanceSummary.absent} absent · {attendanceSummary.late} late</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Exam average</p>
                <p className="mt-2 text-2xl font-semibold text-onyx">{examAverage === null ? '—' : `${examAverage.toFixed(1)}%`}</p>
                <p className="mt-1 text-sm text-gray-600">Calculated from recorded exam results.</p>
              </div>
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Exam Sessions & Report Cards</h3>
              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No exams recorded yet.</p>
                ) : (
                  recentSessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">{session.name}</p>
                        <p className="text-sm text-gray-600">{session.termName}</p>
                      </div>
                      <Link
                        href={`/students/${studentId}/report-card/${session._id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-school-primary border border-gray-300 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <BookOpen className="h-4 w-4" />
                        View Report Card
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-onyx">Section history</h2>
            <div className="mt-6 space-y-3">
              {sectionHistory.map((entry) => (
                <div key={entry._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">{new Date(entry.effectiveDate).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-gray-600">{entry.reason ?? 'Placement update'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
