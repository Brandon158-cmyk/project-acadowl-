'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import type { Id } from '@/../convex/_generated/dataModel';
import { RegisterUserForm } from './RegisterUserForm';

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  school_admin: 'School Admin',
  deputy_head: 'Deputy Head',
  bursar: 'Bursar',
  teacher: 'Teacher',
  class_teacher: 'Class Teacher',
  matron: 'Matron',
  librarian: 'Librarian',
  driver: 'Driver',
  guardian: 'Guardian',
  student: 'Student',
};

export default function PlatformUsersPage() {
  const schools = useQuery(api.schools.queries.listAll);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<'schools'> | ''>('');

  const users = useQuery(
    api.users.queries.listBySchool,
    selectedSchoolId ? { schoolId: selectedSchoolId as Id<'schools'> } : 'skip',
  );

  if (schools === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Register and manage users across schools"
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2"
          >
            <UserPlus size={18} />
            Register user
          </button>
        }
      />

      {/* School filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label htmlFor="filter-school" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by school
        </label>
        <select
          id="filter-school"
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value as Id<'schools'> | '')}
          className="w-full max-w-md h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm"
        >
          <option value="">Select a school to view users</option>
          {schools.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* User list */}
      {!selectedSchoolId ? (
        <EmptyState
          icon={Users}
          title="Select a school"
          description="Choose a school from the dropdown above to view its users."
        />
      ) : users === undefined ? (
        <PageSkeleton />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users registered"
          description="Register the first user for this school."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2"
            >
              <UserPlus size={18} />
              Register user
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Name</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Email</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Phone</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Role</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                    <td className="p-4 text-sm text-gray-600">{user.email ?? '\u2014'}</td>
                    <td className="p-4 text-sm text-gray-600">{user.phone ?? '\u2014'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Register user modal */}
      {showForm && (
        <RegisterUserForm
          schools={schools}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
