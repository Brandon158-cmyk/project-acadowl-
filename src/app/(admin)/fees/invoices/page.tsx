'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, Send, Ban, Eye, RotateCcw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatZMW } from '@/lib/utils/formatZMW';
import { api } from '../../../../../convex/_generated/api';

const INVOICE_STATUS = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  sent: { label: 'Sent', className: 'bg-info-bg text-info border-info-border' },
  partial: { label: 'Partial', className: 'bg-warning-bg text-warning border-warning-border' },
  paid: { label: 'Paid', className: 'bg-success-bg text-success border-success-border' },
  overdue: { label: 'Overdue', className: 'bg-error-bg text-error border-error-border' },
  void: { label: 'Void', className: 'bg-gray-100 text-gray-400 border-gray-200 line-through' },
};

export default function InvoicesPage() {
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceToVoid, setInvoiceToVoid] = useState<any>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const terms = useQuery(api.terms.getActiveTerms);
  const invoices = useQuery(
    api.fees.invoices.getInvoicesByTerm,
    selectedTermId ? { termId: selectedTermId as any } : 'skip'
  );

  const voidInvoice = useMutation(api.fees.invoices.voidInvoice);
  const sendInvoice = useMutation(api.fees.invoices.sendInvoice);

  const handleVoid = async () => {
    if (!invoiceToVoid) return;
    setIsVoiding(true);
    try {
      await voidInvoice({ invoiceId: invoiceToVoid._id, reason: 'Voided by admin' });
      setInvoiceToVoid(null);
    } finally {
      setIsVoiding(false);
    }
  };

  const handleSend = async (invoiceId: string) => {
    await sendInvoice({ invoiceId: invoiceId as any });
  };

  // Filter invoices
  const filteredInvoices = invoices?.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.studentName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (terms === undefined) {
    return <InvoicesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage student fee invoices"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Link href="/fees/invoices/bulk">
                <RotateCcw className="h-4 w-4" />
                Bulk Generate
              </Link>
            </Button>
            <Button className="gap-2 bg-accent hover:bg-accent-hover">
              <Link href="/fees/invoices/consolidated">
                <Plus className="h-4 w-4" />
                Consolidated
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search by invoice number or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-[13px]"
            />
          </div>
        </div>
        <Select value={selectedTermId || ''} onValueChange={(value) => setSelectedTermId(value || null as any)}>
          <SelectTrigger className="w-[180px] text-[13px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms?.map((term) => (
              <SelectItem key={term._id} value={term._id} className="text-[13px]">
                {term.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
          <SelectTrigger className="w-[140px] text-[13px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Statuses</SelectItem>
            <SelectItem value="draft" className="text-[13px]">Draft</SelectItem>
            <SelectItem value="sent" className="text-[13px]">Sent</SelectItem>
            <SelectItem value="partial" className="text-[13px]">Partial</SelectItem>
            <SelectItem value="paid" className="text-[13px]">Paid</SelectItem>
            <SelectItem value="overdue" className="text-[13px]">Overdue</SelectItem>
            <SelectItem value="void" className="text-[13px]">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <SectionCard
        title="All Invoices"
        description={selectedTermId ? `Showing invoices for selected term` : 'Select a term to view invoices'}
      >
        {selectedTermId ? (
          filteredInvoices !== undefined ? (
            filteredInvoices.length > 0 ? (
              <div className="border border-border-panel rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-surface-subtle">
                    <TableRow className="border-b border-border-inner hover:bg-transparent">
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Invoice #
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Student
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Total
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Paid
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Balance
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Status
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border-row bg-white">
                    {filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice._id}
                        className="hover:bg-surface-subtle transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          <Link
                            href={`/fees/invoices/${invoice._id}`}
                            className="font-mono text-[13px] text-accent hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <p className="text-[13px] font-medium text-text-primary">
                            {invoice.studentName || 'Unknown'}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] text-text-primary tabular-nums">
                            {formatZMW(invoice.totalZMW)}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] text-success tabular-nums">
                            {formatZMW(invoice.paidZMW)}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] font-medium text-text-primary tabular-nums">
                            {formatZMW(invoice.balanceZMW)}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${INVOICE_STATUS[invoice.status as keyof typeof INVOICE_STATUS]?.className || ''}`}
                          >
                            {INVOICE_STATUS[invoice.status as keyof typeof INVOICE_STATUS]?.label || invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Link href={`/fees/invoices/${invoice._id}`}>
                                <Eye className="h-4 w-4 text-text-secondary" />
                              </Link>
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleSend(invoice._id)}
                              >
                                <Send className="h-4 w-4 text-accent" />
                              </Button>
                            )}
                            {['sent', 'partial', 'overdue'].includes(invoice.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setInvoiceToVoid(invoice)}
                              >
                                <Ban className="h-4 w-4 text-error" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12">
                <Empty>
                  <EmptyTitle>No invoices found</EmptyTitle>
                  <EmptyDescription>{searchQuery ? 'Try adjusting your search' : 'Generate invoices for this term'}</EmptyDescription>
                  {!searchQuery && (
                    <Button className="gap-2 bg-accent hover:bg-accent-hover">
                      <Link href="/fees/invoices/bulk">
                        <Plus className="h-4 w-4" />
                        Generate Invoices
                        </Link>
                      </Button>
                    )}
                  
                </Empty>
              </div>
            )
          ) : (
            <Skeleton className="h-64" />
          )
        ) : (
          <div className="py-12 text-center">
            <p className="text-[13px] text-text-secondary">
              Select a term to view invoices
            </p>
          </div>
        )}
      </SectionCard>

      {/* Void Confirmation Dialog */}
      <Dialog open={!!invoiceToVoid} onOpenChange={() => setInvoiceToVoid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <AlertCircle className="h-5 w-5" />
              Void Invoice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to void invoice {invoiceToVoid?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInvoiceToVoid(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={isVoiding}
            >
              {isVoiding ? 'Voiding...' : 'Void Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
