import { DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';

export default function ParentFeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees"
        description="This screen is reserved for the finance workflows that will be completed in the fees wave."
      />

      <FeedbackBanner
        tone="warning"
        title="Finance data is not part of Waves 1A and 2"
        description="The fee portal is present for navigation consistency, but full fee balances, invoices, and payment flows will be introduced in the dedicated finance implementation wave."
      />

      <SectionCard title="Fee workspace" description="This placeholder preserves the complete parent navigation flow without exposing incomplete financial records.">
        <EmptyState icon={DollarSign} title="Finance view pending" description="Fee balances, invoices, and payment actions will become available once the finance wave is implemented." />
      </SectionCard>
    </div>
  );
}
