import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const variants = {
  accent: {
    border: "border-t-[3px] border-t-accent",
    icon: "bg-accent-bg",
    iconStroke: "text-accent",
    value: "text-accent",
  },
  success: {
    border: "border-t-[3px] border-t-[var(--success)]",
    icon: "bg-success-bg",
    iconStroke: "text-[var(--success)]",
    value: "text-[var(--success)]",
  },
  warning: {
    border: "border-t-[3px] border-t-[var(--warning)]",
    icon: "bg-warning-bg",
    iconStroke: "text-[var(--warning)]",
    value: "text-[var(--warning)]",
  },
  info: {
    border: "border-t-[3px] border-t-[var(--info)]",
    icon: "bg-info-bg",
    iconStroke: "text-[var(--info)]",
    value: "text-[var(--info)]",
  },
  neutral: {
    border: "",
    icon: "bg-surface-subtle",
    iconStroke: "text-text-secondary",
    value: "text-text-primary",
  },
  error: {
    border: "border-t-[3px] border-t-[var(--error)]",
    icon: "bg-error-bg",
    iconStroke: "text-[var(--error)]",
    value: "text-[var(--error)]",
  },
} as const;

type Variant = keyof typeof variants;

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  color?: Variant;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  color = "neutral",
  trend,
}: MetricCardProps) {
  const v = variants[color];
  return (
    <div
      className={cn(
        "relative bg-surface border border-border-panel rounded-lg p-4 transition-colors duration-150 hover:bg-surface-subtle",
        v.border,
      )}
    >
      <div
        className={cn(
          "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-[6px]",
          v.icon,
        )}
      >
        <Icon size={15} className={v.iconStroke} aria-hidden="true" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-[26px] font-bold leading-none tracking-tight",
          v.value,
        )}
      >
        {value}
      </p>
      {helper && (
        <p className="mt-1.5 text-[11px] text-text-secondary">{helper}</p>
      )}
      {trend && (
        <p className="mt-1.5 text-[11px] text-text-secondary">
          {trend.isPositive ? "+" : "-"}{trend.value}%
        </p>
      )}
    </div>
  );
}
