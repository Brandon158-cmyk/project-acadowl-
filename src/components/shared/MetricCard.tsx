import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
}

export function MetricCard({ label, value, helper, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-white border border-border-panel rounded-lg p-5 shadow-none group transition-all duration-150 hover:bg-surface-subtle">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-text-secondary">{label}</p>
          <p className="mt-1 text-[18px] font-semibold text-text-primary tracking-tight">{value}</p>
          {helper ? <p className="mt-1 text-[13px] text-text-secondary">{helper}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-subtle group-hover:bg-surface-hover transition-colors">
          <Icon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
