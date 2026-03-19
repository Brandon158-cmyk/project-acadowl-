import { PageHeader } from '@/components/shared/PageHeader';

export default function DriverRoutePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Route"
        description="Today\u2019s pickup and drop-off schedule"
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-slate">
          Driver GPS PWA will be built in Sprint 05.
        </p>
      </div>
    </div>
  );
}
