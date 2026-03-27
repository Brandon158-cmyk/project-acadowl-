'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ParentChildFeesPage() {
  const params = useParams<{ studentId: string }>();

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700">Use the main fees screen for consolidated balances and payment actions.</p>
        <Link href="/fees" className="mt-3 inline-flex rounded-lg bg-school-primary px-3 py-2 text-xs font-medium text-white">
          Go to Fees Overview
        </Link>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500">Student reference</p>
        <p className="text-sm font-medium text-onyx">{params.studentId}</p>
      </section>
    </div>
  );
}
