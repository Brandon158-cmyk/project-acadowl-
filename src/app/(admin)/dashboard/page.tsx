import { PageHeader } from '@/components/shared/PageHeader';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your school at a glance"
      />

      {/* Stat cards placeholder */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: '\u2014' },
          { label: 'Staff Members', value: '\u2014' },
          { label: 'Attendance Today', value: '\u2014' },
          { label: 'Fee Collection', value: '\u2014' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <p className="text-sm text-slate">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-onyx">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Dashboard widgets will be populated in Sprint 01.
        </p>
      </div>
    </div>
  );
}
