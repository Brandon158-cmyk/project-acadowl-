import { PageHeader } from '@/components/shared/PageHeader';

export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Portal"
        description="View your grades, timetable, and assignments"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Student portal will be populated in a future sprint.
        </p>
      </div>
    </div>
  );
}
