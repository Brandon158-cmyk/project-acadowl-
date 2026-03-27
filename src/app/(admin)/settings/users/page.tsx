'use client';

import { useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { CreateSchoolUserModal } from './CreateSchoolUserModal';
import { KeyRound, UserPlus, Users } from 'lucide-react';

type SchoolManagedRole =
  | 'school_admin'
  | 'deputy_head'
  | 'bursar'
  | 'teacher'
  | 'class_teacher'
  | 'matron'
  | 'librarian'
  | 'driver'
  | 'guardian'
  | 'student';

const SCHOOL_ROLE_LABELS: Record<SchoolManagedRole, string> = {
  school_admin: 'School Admin',
  deputy_head: 'Deputy Head',
  bursar: 'Bursar',
  teacher: 'Teacher',
  class_teacher: 'Class Teacher',
  matron: 'Matron',
  librarian: 'Librarian',
  driver: 'Driver',
  guardian: 'Parent/Guardian',
  student: 'Student',
};

const manageableRoles: SchoolManagedRole[] = [
  'school_admin',
  'deputy_head',
  'bursar',
  'teacher',
  'class_teacher',
  'matron',
  'librarian',
  'driver',
  'guardian',
  'student',
];

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminUsersSettingsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [lastReset, setLastReset] = useState<{ email?: string; tempPassword: string } | null>(null);

  const users = useQuery(api.users.queries.listForSchoolAdmin, {
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    includeInactive,
    limit: 200,
  });

  const setUserActiveStatus = useMutation(api.users.mutations.setUserActiveStatus);
  const updateUserRole = useMutation(api.users.mutations.updateUserRoleInSchool);
  const resetPassword = useAction(api.users.actions.schoolAdminResetUserPassword);

  const roleOptions = useMemo(() => manageableRoles.map((role) => ({
    value: role,
    label: SCHOOL_ROLE_LABELS[role],
  })), []);

  if (users === undefined) {
    return <PageSkeleton />;
  }

  const onToggleActive = async (userId: Id<'users'>, isActive: boolean) => {
    await setUserActiveStatus({ userId, isActive });
  };

  const onRoleChange = async (userId: Id<'users'>, role: SchoolManagedRole) => {
    await updateUserRole({ userId, role });
  };

  const onResetPassword = async (userId: Id<'users'>) => {
    const tempPassword = generateTempPassword();
    const result = await resetPassword({
      userId,
      tempPassword,
    });

    setLastReset({
      email: result.email ?? undefined,
      tempPassword,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage guardians, staff, and other users in your school."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2 text-sm font-medium text-white"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        }
      />

      {lastReset ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Temporary password generated</p>
          <p className="mt-1">{lastReset.email ?? 'User'} → <span className="font-mono">{lastReset.tempPassword}</span></p>
          <p className="mt-1 text-amber-800">Share it securely. User will be prompted to change it on next login.</p>
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone"
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>

          <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive users
          </label>
        </div>
      </section>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No matching users in your school scope for the selected filters."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Linked Profile</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-medium text-onyx">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email ?? user.phone ?? 'No email/phone'}</p>
                    </td>

                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => onRoleChange(user._id, e.target.value as SchoolManagedRole)}
                        className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>

                    <td className="p-4 text-sm text-gray-700">
                      {user.linkedProfile ? `${user.linkedProfile.type}: ${user.linkedProfile.label}` : '—'}
                    </td>

                    <td className="p-4">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={user.isActive}
                          onChange={(e) => onToggleActive(user._id, e.target.checked)}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => onResetPassword(user._id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 p-4 text-sm text-gray-500">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {showCreate ? <CreateSchoolUserModal onClose={() => setShowCreate(false)} /> : null}
    </div>
  );
}
