'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { BookOpen, GraduationCap, Plus, Search, ShieldCheck } from 'lucide-react';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { BulkImportDialog } from './BulkImportDialog';

const ENROLLMENT_STYLE: Record<string, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-amber-100 text-amber-800',
  expelled: 'bg-error/10 text-error',
  withdrawn: 'bg-error/10 text-error',
  transferred: 'bg-info/10 text-info',
  graduated: 'bg-info/10 text-info',
};

function EnrollmentBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ENROLLMENT_STYLE[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [status, setStatus] = useState('');

  const formData = useQuery(api.students.queries.getEnrollmentFormData);
  const students = useQuery(api.students.queries.listStudents, {
    search: search.trim() || undefined,
    gradeId: gradeId ? (gradeId as Id<'grades'>) : undefined,
    sectionId: sectionId ? (sectionId as Id<'sections'>) : undefined,
    enrollmentStatus: status
      ? (status as 'active' | 'suspended' | 'graduated' | 'transferred' | 'dropped_out')
      : undefined,
  });

  const sectionOptions = useMemo(() => {
    if (!formData) return [];
    if (!gradeId) return formData.sections;
    return formData.sections.filter((section) => section.gradeId === gradeId);
  }, [formData, gradeId]);

  if (formData === undefined || students === undefined) {
    return <PageSkeleton />;
  }

  const activeStudents = students.filter((student) => student.enrollmentStatus === 'active').length;
  const linkedGuardians = students.filter((student) => student.guardians.length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student enrolment, placement, and guardian-linked records for the current school."
        actions={
          <div className="flex items-center gap-3">
            <BulkImportDialog />
            <Link
              href="/students/enroll"
              className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Enroll student
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visible students" value={String(students.length)} helper="Filtered result set shown below" icon={GraduationCap} />
        <MetricCard label="Active enrolments" value={String(activeStudents)} helper="Students currently marked active" icon={ShieldCheck} />
        <MetricCard label="Guardian-linked" value={String(linkedGuardians)} helper="Students with at least one guardian relationship" icon={BookOpen} />
        <MetricCard label="Configured grades" value={String(formData.grades.length)} helper="Academic ladders available for placement" icon={BookOpen} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, student number, phone, guardian"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Grade</span>
            <select
              value={gradeId}
              onChange={(event) => {
                setGradeId(event.target.value);
                setSectionId('');
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All grades</option>
              {formData.grades.map((grade) => (
                <option key={grade._id} value={grade._id}>{grade.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Section</span>
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All sections</option>
              {sectionOptions.map((section) => (
                <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="dropped_out">Dropped out</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description="Adjust your filters or enroll the first student for this school."
            action={
              <Link
                href="/students/enroll"
                className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Enroll student
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Grade</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Section</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Primary guardian</th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const primaryGuardian = student.guardians.find((guardian) => guardian?.isPrimary) ?? student.guardians[0];

                    return (
                      <tr key={student._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4">
                          <Link href={`/students/${student._id}`} className="block">
                            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-600">{student.studentNumber}</p>
                          </Link>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{student.grade?.name ?? 'Unassigned'}</td>
                        <td className="p-4 text-sm text-gray-600">{student.section?.displayName ?? student.section?.name ?? 'Unassigned'}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {primaryGuardian ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}` : 'Not linked'}
                        </td>
                        <td className="p-4 text-right">
                          <EnrollmentBadge status={student.enrollmentStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500">
              <span>Showing {students.length} student{students.length === 1 ? '' : 's'}</span>
              <span>Use the filters above to narrow the current list.</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
