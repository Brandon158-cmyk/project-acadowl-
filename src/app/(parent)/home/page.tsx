import { PageHeader } from '@/components/shared/PageHeader';

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back"
        description="Here\u2019s how your children are doing"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Parent dashboard will be populated in Sprint 03.
        </p>
      </div>
    </div>
  );
}
