'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Shield, CheckCircle, XCircle, AlertTriangle, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { format } from 'date-fns';

const ZRA_STATUS = {
  not_submitted: { label: 'Not Submitted', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  submitted: { label: 'Fiscalised', className: 'bg-success-bg text-success border-success-border' },
  failed: { label: 'Failed', className: 'bg-error-bg text-error border-error-border' },
  mock: { label: 'Mock', className: 'bg-info-bg text-info border-info-border' },
};

export default function ZraCompliancePage() {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [retryInvoice, setRetryInvoice] = useState<any>(null);
  const [bulkRetryOpen, setBulkRetryOpen] = useState(false);

  const terms = useQuery(api.terms.getActiveTerms);
  const compliance = useQuery(
    api.fees.zra.getZraComplianceStatus,
    selectedTermId ? { termId: selectedTermId as any } : 'skip'
  );

  const resubmitInvoice = useMutation(api.fees.zra.resubmitInvoiceToZra);
  const resubmitFailed = useMutation(api.fees.zra.resubmitFailedToZra);

  const handleRetry = async () => {
    if (!retryInvoice) return;
    await resubmitInvoice({ invoiceId: retryInvoice._id });
    setRetryInvoice(null);
  };

  const handleBulkRetry = async () => {
    await resubmitFailed({});
    setBulkRetryOpen(false);
  };

  if (terms === undefined) {
    return <ZraSkeleton />;
  }

  const failedInvoices = compliance?.invoices.filter(i => i.zraStatus === 'failed') || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ZRA Compliance"
        description="Smart Invoice fiscalisation status and ZRA VSDC integration"
        actions={
          failedInvoices.length > 0 && (
            <Button 
              onClick={() => setBulkRetryOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Failed ({failedInvoices.length})
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <Select value={selectedTermId} onValueChange={setSelectedTermId}>
          <SelectTrigger className="w-[200px] text-[13px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms?.map((term) => (
              <SelectItem key={term._id} value={term._id} className="text-[13px]">{term.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTermId ? (
        compliance ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="p-4 bg-white border border-border-panel rounded-lg">
                <p className="text-[12px] text-text-secondary mb-1">Total Invoices</p>
                <p className="text-[20px] font-semibold text-text-primary">{compliance.summary.total}</p>
              </div>
              <div className="p-4 bg-success-bg border border-success-border rounded-lg">
                <p className="text-[12px] text-success mb-1">Fiscalised</p>
                <p className="text-[20px] font-semibold text-success">{compliance.summary.submitted}</p>
              </div>
              <div className="p-4 bg-error-bg border border-error-border rounded-lg">
                <p className="text-[12px] text-error mb-1">Failed</p>
                <p className="text-[20px] font-semibold text-error">{compliance.summary.failed}</p>
              </div>
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                <p className="text-[12px] text-gray-600 mb-1">Not Submitted</p>
                <p className="text-[20px] font-semibold text-gray-700">{compliance.summary.notSubmitted}</p>
              </div>
              <div className="p-4 bg-info-bg border border-info-border rounded-lg">
                <p className="text-[12px] text-info mb-1">Mock Mode</p>
                <p className="text-[20px] font-semibold text-info">{compliance.summary.mock}</p>
              </div>
            </div>

            {/* Failed Invoices Table */}
            {failedInvoices.length > 0 && (
              <SectionCard 
                title="Failed Fiscalisations" 
                description="Invoices that need to be resubmitted to ZRA"
                className="border-error-border"
              >
                <div className="border border-error-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-error-bg/50">
                      <TableRow className="border-b border-error-border hover:bg-transparent">
                        <TableHead className="text-[12px] font-medium text-error uppercase tracking-wider px-4 py-3">Invoice #</TableHead>
                        <TableHead className="text-[12px] font-medium text-error uppercase tracking-wider px-4 py-3">Student</TableHead>
                        <TableHead className="text-[12px] font-medium text-error uppercase tracking-wider px-4 py-3 text-right">Amount</TableHead>
                        <TableHead className="text-[12px] font-medium text-error uppercase tracking-wider px-4 py-3">Error</TableHead>
                        <TableHead className="text-[12px] font-medium text-error uppercase tracking-wider px-4 py-3 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-error-border/30 bg-white">
                      {failedInvoices.map((invoice) => (
                        <TableRow key={invoice._id} className="hover:bg-error-bg/20 transition-colors">
                          <TableCell className="px-4 py-3">
                            <span className="font-mono text-[13px] text-text-primary">{invoice.invoiceNumber}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-[13px] text-text-primary">{invoice.studentName}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <p className="text-[13px] tabular-nums">{formatZMW(invoice.totalZMW)}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-[12px] text-error">{invoice.zraErrorMessage || 'Unknown error'}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setRetryInvoice(invoice)}
                              className="gap-1 text-[12px]"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Retry
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            )}

            {/* All Invoices Table */}
            <SectionCard title="All Invoice Statuses" description="Complete fiscalisation status for all invoices">
              {compliance.invoices.length > 0 ? (
                <div className="border border-border-panel rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-surface-subtle sticky top-0">
                      <TableRow className="border-b border-border-inner hover:bg-transparent">
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Invoice #</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Amount</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">ZRA Status</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Fiscal Code</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-row bg-white">
                      {compliance.invoices.map((invoice) => (
                        <TableRow key={invoice._id} className="hover:bg-surface-subtle transition-colors">
                          <TableCell className="px-4 py-3">
                            <span className="font-mono text-[13px] text-text-primary">{invoice.invoiceNumber}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-[13px] text-text-primary">{invoice.studentName}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <p className="text-[13px] tabular-nums">{formatZMW(invoice.totalZMW)}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge variant="outline" className={`text-[11px] ${ZRA_STATUS[invoice.zraStatus as keyof typeof ZRA_STATUS]?.className || ''}`}>
                              {ZRA_STATUS[invoice.zraStatus as keyof typeof ZRA_STATUS]?.label || invoice.zraStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {invoice.fiscalCode ? (
                              <span className="font-mono text-[12px] text-text-secondary">{invoice.fiscalCode}</span>
                            ) : (
                              <span className="text-[12px] text-text-tertiary">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            {invoice.zraStatus === 'failed' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => setRetryInvoice(invoice)}
                              >
                                <RotateCcw className="h-4 w-4 text-accent" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty>
                  <EmptyTitle>No invoices</EmptyTitle>
                  <EmptyDescription>No invoices found for this term</EmptyDescription>

                </Empty>
              )}
            </SectionCard>
          </>
        ) : (
          <Skeleton className="h-96" />
        )
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-text-secondary">Select a term to view compliance status</p>
        </div>
      )}

      {/* Retry Confirmation */}
      <AlertDialog open={!!retryInvoice} onOpenChange={() => setRetryInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Fiscalisation</AlertDialogTitle>
            <AlertDialogDescription>
              Resubmit invoice {retryInvoice?.invoiceNumber} to ZRA VSDC?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRetryInvoice(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry} className="bg-accent hover:bg-accent-hover">
              Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Retry Confirmation */}
      <AlertDialog open={bulkRetryOpen} onOpenChange={setBulkRetryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry All Failed</AlertDialogTitle>
            <AlertDialogDescription>
              Resubmit all {failedInvoices.length} failed invoices to ZRA? This may take a few minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkRetryOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRetry} className="bg-accent hover:bg-accent-hover">
              Retry All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ZraSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20" />
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
