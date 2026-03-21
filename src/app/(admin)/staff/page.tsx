'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { Users, Plus, Search, ShieldCheck, UserCheck, Loader2 } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { toast } from 'sonner';

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

const STATUS_STYLES = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-error/10 text-error',
};

export default function StaffPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const staff = useQuery(api.schools.staffQueries.listStaff, {
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === '' ? undefined : statusFilter === 'active',
  });

  if (staff === undefined) {
    return <PageSkeleton />;
  }

  const activeCount = staff.filter((s) => s.isActive).length;
  const teachingCount = staff.filter((s) => s.staffCategory === 'teaching').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage staff records, employment details, and teaching assignments."
        actions={
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add staff
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Total Staff" value={String(staff.length)} helper="All staff records" icon={Users} />
        <MetricCard label="Active Staff" value={String(activeCount)} helper="Currently active" icon={UserCheck} />
        <MetricCard label="Teaching Staff" value={String(teachingCount)} helper="Assigned to teaching" icon={ShieldCheck} />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, employee number, email, phone"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Role</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff found"
            description="Adjust your filters or add the first staff member."
            action={
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add staff
              </button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Staff Member</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Department</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map((member) => (
                    <tr key={member._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="p-4">
                        <Link href={`/staff/${member._id}`} className="block">
                          <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                          <p className="text-sm text-gray-600">{member.employeeNumber ?? '—'}</p>
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{ROLE_LABELS[member.role] ?? member.role}</td>
                      <td className="p-4 text-sm text-gray-600">{member.department ?? '—'}</td>
                      <td className="p-4 text-sm text-gray-600">{member.phone ?? '—'}</td>
                      <td className="p-4 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${member.isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500">
              <span>Showing {staff.length} staff member{staff.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}
      </section>

      {/* Add Staff Dialog */}
      {showAddForm && <AddStaffDialog onClose={() => setShowAddForm(false)} />}
    </div>
  );
}

function AddStaffDialog({ onClose }: { onClose: () => void }) {
  const createStaff = useMutation(api.schools.staffMutations.createStaff);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    try {
      const result = await createStaff({
        firstName: form.get('firstName') as string,
        lastName: form.get('lastName') as string,
        email: (form.get('email') as string) || undefined,
        phone: (form.get('phone') as string) || undefined,
        gender: (form.get('gender') as 'male' | 'female') || undefined,
        role: form.get('role') as 'teacher',
        staffCategory: (form.get('staffCategory') as 'teaching' | 'non_teaching') || undefined,
        department: (form.get('department') as string) || undefined,
        dateJoined: Date.now(),
      });
      toast.success(`Staff member created: ${result.employeeNumber}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setSaving(false);
    }
  }, [createStaff, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl font-semibold text-onyx">Add Staff Member</h2>
        <p className="mt-1 text-sm text-slate">Fill in the basic details. You can add more information later.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">First Name *</span>
              <input name="firstName" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Last Name *</span>
              <input name="lastName" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input name="email" type="email" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input name="phone" type="tel" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Gender</span>
              <select name="gender" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Role *</span>
              <select name="role" required className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <select name="staffCategory" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select</option>
                <option value="teaching">Teaching</option>
                <option value="non_teaching">Non-Teaching</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Department</span>
              <input name="department" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
          </div>

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
              {saving ? 'Saving…' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
