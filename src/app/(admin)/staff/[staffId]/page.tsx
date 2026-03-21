'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { ArrowLeft, Mail, Phone, ShieldCheck, Calendar, Award, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'Admin',
  deputy_head: 'Deputy Head',
  bursar: 'Bursar',
  teacher: 'Teacher',
  class_teacher: 'Class Teacher',
  matron: 'Matron',
  librarian: 'Librarian',
  driver: 'Driver',
  support_staff: 'Support Staff',
};

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.staffId as Id<'staff'>;
  const staff = useQuery(api.schools.staffQueries.getStaffDetail, { staffId });
  const toggleStatus = useMutation(api.schools.staffMutations.toggleStaffStatus);
  const [toggling, setToggling] = useState(false);

  const handleToggle = useCallback(async () => {
    setToggling(true);
    try {
      const result = await toggleStatus({ staffId });
      toast.success(result.isActive ? 'Staff member reactivated' : 'Staff member deactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setToggling(false);
    }
  }, [toggleStatus, staffId]);

  if (staff === undefined) {
    return <PageSkeleton />;
  }

  if (staff === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-gray-900">Staff member not found</p>
        <Link href="/staff" className="mt-4 text-sm text-school-primary hover:text-crimson-dark">
          ← Back to Staff
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/staff"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          aria-label="Back to staff list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-onyx">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="text-sm text-slate">{staff.employeeNumber ?? 'No employee number'}</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all ${
            staff.isActive
              ? 'border border-error/30 text-error hover:bg-error/5'
              : 'border border-success/30 text-success hover:bg-success/5'
          }`}
        >
          {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
          {staff.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-onyx">Profile</h2>
          <dl className="mt-4 space-y-3">
            <DetailRow icon={Mail} label="Email" value={staff.email ?? '—'} />
            <DetailRow icon={Phone} label="Phone" value={staff.phone ?? '—'} />
            <DetailRow icon={ShieldCheck} label="NRC Number" value={staff.nrcNumber ?? '—'} />
            <DetailRow icon={Calendar} label="Gender" value={staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : '—'} />
          </dl>
        </section>

        {/* Employment Card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-onyx">Employment</h2>
          <dl className="mt-4 space-y-3">
            <DetailRow icon={Award} label="Role" value={ROLE_LABELS[staff.role] ?? staff.role} />
            <DetailRow icon={ShieldCheck} label="Category" value={staff.staffCategory === 'teaching' ? 'Teaching' : staff.staffCategory === 'non_teaching' ? 'Non-Teaching' : '—'} />
            <DetailRow icon={Calendar} label="Department" value={staff.department ?? '—'} />
            <DetailRow icon={Calendar} label="Contract" value={staff.contractType?.replace('_', ' ') ?? '—'} />
            <DetailRow icon={Calendar} label="Date Joined" value={new Date(staff.dateJoined).toLocaleDateString()} />
            {staff.dateLeft && (
              <DetailRow icon={Calendar} label="Date Left" value={new Date(staff.dateLeft).toLocaleDateString()} />
            )}
          </dl>
        </section>

        {/* Qualifications */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-onyx">Qualifications</h2>
          {staff.qualifications && staff.qualifications.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {staff.qualifications.map((q, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <Award className="h-4 w-4 text-slate" />
                  {q}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate">No qualifications recorded.</p>
          )}
          {staff.eczRegistrationNumber && (
            <p className="mt-4 text-sm text-gray-600">
              <span className="font-medium">ECZ Registration:</span> {staff.eczRegistrationNumber}
            </p>
          )}
        </section>

        {/* Subject Assignments */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-onyx">Subject Assignments</h2>
          {staff.assignments.length === 0 ? (
            <p className="mt-4 text-sm text-slate">No subject assignments.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Subject</th>
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Section</th>
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Primary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.assignments.map((a) => (
                    <tr key={a._id}>
                      <td className="py-2 text-sm text-gray-700">{a.subject?.name ?? '—'}</td>
                      <td className="py-2 text-sm text-gray-700">{a.section?.displayName ?? a.section?.name ?? '—'}</td>
                      <td className="py-2 text-sm">{a.isPrimaryTeacher ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Class Teacher Sections */}
          {staff.classTeacherSections.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700">Class Teacher For:</h3>
              <ul className="mt-2 space-y-1">
                {staff.classTeacherSections.map((s) => (
                  <li key={s._id} className="text-sm text-gray-600">
                    {s.displayName ?? s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-slate" aria-hidden="true" />
      <dt className="w-28 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
