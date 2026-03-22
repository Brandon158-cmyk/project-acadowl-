import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-border-panel bg-white">
      <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-border-inner">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
          {description ? <p className="mt-0.5 max-w-3xl text-[13px] text-text-secondary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
