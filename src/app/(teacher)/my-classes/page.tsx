import { PageHeader } from '@/components/shared/PageHeader';

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description="Your classes and tasks for today"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Teacher dashboard will be populated in Sprint 01.
        </p>
      </div>
    </div>
  );
}
