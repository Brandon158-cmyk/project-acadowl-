import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[18px] font-semibold text-text-primary tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[14px] text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="mt-3 flex gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
