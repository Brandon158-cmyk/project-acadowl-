'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';
import { Plus, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { CreateSchoolModal } from './CreateSchoolModal';

type SchoolRow = FunctionReturnType<typeof api.schools.queries.listAll>[number];

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  primary_day: 'Primary Day',
  primary_boarding: 'Primary Boarding',
  secondary_day: 'Secondary Day',
  secondary_boarding: 'Secondary Boarding',
  mixed_secondary: 'Mixed Secondary',
  combined: 'Combined',
  college: 'College / HEI',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};

export default function PlatformSchoolsPage() {
  const schools = useQuery(api.schools.queries.listAll);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (schools === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools"
        description="Manage all schools on the Acadowl platform"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} />
            Add school
          </button>
        }
      />

      {schools.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No schools yet"
          description="Create your first school to get started with the platform."
          action={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              Add school
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
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Type</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Province</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Tier</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</th>
                  <th className="p-4 text-xs uppercase tracking-wider text-gray-500 font-semibold text-right">Slug</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((school: SchoolRow) => (
                  <tr key={school._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{school.name}</p>
                        {school.email && (
                          <p className="text-xs text-gray-500 mt-0.5">{school.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {SCHOOL_TYPE_LABELS[school.type] ?? school.type}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {school.province ?? '\u2014'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {TIER_LABELS[school.subscriptionTier] ?? school.subscriptionTier}
                      </span>
                    </td>
                    <td className="p-4">
                      {school.isActive ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-sm text-gray-500">{school.slug}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
            Showing {schools.length} school{schools.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <CreateSchoolModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
