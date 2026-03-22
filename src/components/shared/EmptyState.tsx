import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'error' | 'success' | 'info';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'error',
}: EmptyStateProps) {
  const variantStyles = {
    default: { bg: 'bg-accent-bg', text: 'text-accent' },
    error: { bg: 'bg-error-bg', text: 'text-error' },
    success: { bg: 'bg-success-bg', text: 'text-success' },
    info: { bg: 'bg-info-bg', text: 'text-info' },
  };

  const { bg, text } = variantStyles[variant];

  return (
    <div className="bg-white border border-border-panel rounded-lg">
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className={`${bg} rounded-xl p-3`}>
          <Icon className={`h-6 w-6 ${text}`} aria-hidden="true" />
        </div>
        <p className="text-[16px] font-semibold text-text-primary">{title}</p>
        <p className="text-[13px] text-text-secondary">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
