'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { BookOpen, Save, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { toast } from 'sonner';

export default function MarksEntryPage() {
  const [sessionId, setSessionId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  // Fetch available sessions, sections, and subjects
  const sessions = useQuery(api.schools.examQueries.listExamSessions, {});
  const formData = useQuery(api.students.queries.getEnrollmentFormData);

  // Fetch marks entry data when all filters are selected
  const marksData = useQuery(
    api.schools.examQueries.getMarksEntryData,
    sessionId && sectionId && subjectId
      ? {
          examSessionId: sessionId as Id<'examSessions'>,
          sectionId: sectionId as Id<'sections'>,
          subjectId: subjectId as Id<'subjects'>,
        }
      : 'skip',
  );

  if (sessions === undefined || formData === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marks Entry"
        description="Enter and manage exam results per subject and section."
      />

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Exam Session</span>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">Select session</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.termName})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Section</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">Select section</option>
              {formData.sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.displayName ?? s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Subject</span>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">Select subject</option>
              {formData.subjects?.map((s: { _id: string; name: string; code?: string }) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Results Entry Table */}
      {sessionId && sectionId && subjectId && (
        <MarksTable
          marksData={marksData}
          examSessionId={sessionId as Id<'examSessions'>}
          sectionId={sectionId as Id<'sections'>}
          subjectId={subjectId as Id<'subjects'>}
        />
      )}

      {!sessionId && !sectionId && !subjectId && (
        <section className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-slate">Select an exam session, section, and subject to begin entering marks.</p>
        </section>
      )}
    </div>
  );
}

interface MarksTableProps {
  marksData: {
    session: { name: string; isLocked: boolean };
    students: Array<{
      _id: Id<'students'>;
      firstName: string;
      lastName: string;
      studentNumber: string | null;
      existingResult: { marksObtained: number; maxMarks: number; grade?: string; isLocked: boolean } | null;
    }>;
    gradingScales: Array<{ minScore: number; maxScore: number; gradeLabel: string }>;
    isLocked: boolean;
  } | undefined | null;
  examSessionId: Id<'examSessions'>;
  sectionId: Id<'sections'>;
  subjectId: Id<'subjects'>;
}

function MarksTable({ marksData, examSessionId, sectionId, subjectId }: MarksTableProps) {
  const enterResults = useMutation(api.schools.examMutations.enterExamResults);
  const [marks, setMarks] = useState<Record<string, { obtained: string; max: string }>>({});
  const [saving, setSaving] = useState(false);

  // Initialize marks from existing data
  useMemo(() => {
    if (!marksData) return;
    const initial: Record<string, { obtained: string; max: string }> = {};
    for (const student of marksData.students) {
      if (student.existingResult) {
        initial[student._id] = {
          obtained: String(student.existingResult.marksObtained),
          max: String(student.existingResult.maxMarks),
        };
      } else {
        initial[student._id] = { obtained: '', max: '100' };
      }
    }
    setMarks(initial);
  }, [marksData]);

  const computeGrade = useCallback(
    (obtained: number, max: number) => {
      if (!marksData || max === 0) return '—';
      const pct = (obtained / max) * 100;
      const scale = marksData.gradingScales
        .sort((a, b) => b.minScore - a.minScore)
        .find((s) => pct >= s.minScore && pct <= s.maxScore);
      return scale?.gradeLabel ?? '—';
    },
    [marksData],
  );

  const handleSave = useCallback(async () => {
    if (!marksData) return;
    setSaving(true);

    try {
      const results = marksData.students
        .filter((s) => marks[s._id]?.obtained !== '')
        .map((s) => ({
          studentId: s._id,
          marksObtained: Number(marks[s._id]?.obtained ?? 0),
          maxMarks: Number(marks[s._id]?.max ?? 100),
        }));

      if (results.length === 0) {
        toast.error('No marks to save. Enter at least one score.');
        return;
      }

      const { savedCount } = await enterResults({
        examSessionId,
        sectionId,
        subjectId,
        results,
      });

      toast.success(`Saved results for ${savedCount} student${savedCount === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save results');
    } finally {
      setSaving(false);
    }
  }, [marksData, marks, enterResults, examSessionId, sectionId, subjectId]);

  if (marksData === undefined) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-school-primary" />
        <p className="mt-4 text-sm text-slate">Loading student data…</p>
      </section>
    );
  }

  if (marksData === null) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-error" />
        <p className="mt-4 text-sm text-error">Exam session not found or you don&apos;t have access.</p>
      </section>
    );
  }

  if (marksData.isLocked) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            This exam session is locked. Contact an admin to unlock it before editing results.
          </p>
        </div>
      </section>
    );
  }

  if (marksData.students.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm text-center">
        <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm text-slate">No active students in this section.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-onyx">
          {marksData.session.name} — {marksData.students.length} students
        </h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">Marks</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">Out Of</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-20">%</th>
              <th className="p-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-20">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {marksData.students.map((student, idx) => {
              const entry = marks[student._id] ?? { obtained: '', max: '100' };
              const obtained = Number(entry.obtained) || 0;
              const max = Number(entry.max) || 100;
              const pct = entry.obtained ? Math.round((obtained / max) * 100) : null;
              const grade = entry.obtained ? computeGrade(obtained, max) : '—';
              const isLocked = student.existingResult?.isLocked;

              return (
                <tr key={student._id} className={isLocked ? 'bg-gray-50/50' : ''}>
                  <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="p-3">
                    <p className="text-sm font-medium text-gray-900">{student.lastName}, {student.firstName}</p>
                    <p className="text-xs text-gray-500">{student.studentNumber ?? '—'}</p>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      max={Number(entry.max)}
                      step={0.5}
                      value={entry.obtained}
                      disabled={isLocked}
                      onChange={(e) =>
                        setMarks((prev) => ({
                          ...prev,
                          [student._id]: { ...prev[student._id], obtained: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={1}
                      value={entry.max}
                      disabled={isLocked}
                      onChange={(e) =>
                        setMarks((prev) => ({
                          ...prev,
                          [student._id]: { ...prev[student._id], max: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>
                  <td className="p-3 text-sm font-medium text-gray-700">
                    {pct !== null ? `${pct}%` : '—'}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {grade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
