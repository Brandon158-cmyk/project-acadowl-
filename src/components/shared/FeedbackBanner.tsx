import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

interface FeedbackBannerProps {
  title: string;
  description?: string;
  tone?: FeedbackTone;
  action?: ReactNode;
}

const toneStyles: Record<FeedbackTone, { wrapper: string; icon: typeof Info }> = {
  success: { wrapper: 'border-green-200 bg-green-50 text-green-800', icon: CheckCircle2 },
  error: { wrapper: 'border-red-200 bg-red-50 text-red-800', icon: AlertCircle },
  warning: { wrapper: 'border-amber-200 bg-amber-50 text-amber-900', icon: AlertCircle },
  info: { wrapper: 'border-blue-200 bg-blue-50 text-blue-800', icon: Info },
};

export function FeedbackBanner({ title, description, tone = 'info', action }: FeedbackBannerProps) {
  const Icon = toneStyles[tone].icon;

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', toneStyles[tone].wrapper)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
