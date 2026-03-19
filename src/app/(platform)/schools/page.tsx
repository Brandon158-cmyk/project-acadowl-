import { PageHeader } from '@/components/shared/PageHeader';

export default function PlatformSchoolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools"
        description="Manage all schools on the Acadowl platform"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Platform admin school management will be populated in Sprint 01.
        </p>
      </div>
    </div>
  );
}
