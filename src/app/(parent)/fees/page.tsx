'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Wallet } from 'lucide-react';

export default function ParentFeesPage() {
  const data = useQuery(api.guardian.fees.getGuardianFeesOverview);

  if (data === undefined) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Fees" description="Track balances and recent payments for all linked children." />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Total outstanding</p>
            <p className="text-lg font-semibold text-onyx">ZMW {data.totalOutstandingZMW.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Credit balance</p>
            <p className="text-lg font-semibold text-emerald-700">ZMW {data.creditBalanceZMW.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {data.children.length === 0 ? (
        <EmptyState icon={Wallet} title="No fee records" description="No linked student invoices are available yet." />
      ) : (
        <div className="space-y-3">
          {data.children.map((child) => (
            <Link
              key={child.student._id}
              href={`/children/${child.student._id}/fees`}
              className="block rounded-xl border border-gray-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-onyx">{child.student.name}</p>
              <p className="mt-1 text-xs text-gray-500">Balance</p>
              <p className="text-base font-semibold text-amber-700">ZMW {child.balanceZMW.toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
