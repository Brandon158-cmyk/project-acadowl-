import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, helper, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-onyx">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate">{helper}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
          <Icon className="h-5 w-5 text-slate" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
