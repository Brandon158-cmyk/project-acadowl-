'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { FileText } from 'lucide-react';

export default function ParentChildReportCardsPage() {
  return (
    <EmptyState
      icon={FileText}
      title="Report cards"
      description="Report card download and share links will appear here once generated."
    />
  );
}
