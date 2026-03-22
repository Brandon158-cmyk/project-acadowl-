'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Link2, RotateCcw, XCircle, Banknote, Smartphone, Search } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { format } from 'date-fns';

const PAYMENT_METHODS: Record<string, string> = {
  airtel_money: 'Airtel Money',
  mtn_momo: 'MTN MoMo',
  bank_transfer: 'Bank Transfer',
  unknown: 'Unknown',
};

export default function UnallocatedPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allocatingPayment, setAllocatingPayment] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unallocated = useQuery(api.fees.unallocatedPayments.getUnallocatedPayments);
  const allocatePayment = useMutation(api.fees.unallocatedPayments.allocatePayment);
  const markAsRefunded = useMutation(api.fees.unallocatedPayments.markAsRefunded);

  // Get invoices for the selected payment's student
  const studentInvoices = useQuery(
    api.fees.invoices.getInvoicesForStudent,
    allocatingPayment?.matchedStudentId ? { studentId: allocatingPayment.matchedStudentId } : 'skip'
  );

  const handleAllocate = async () => {
    if (!allocatingPayment || !selectedInvoice) return;
    setIsSubmitting(true);
    try {
      await allocatePayment({
        unallocatedPaymentId: allocatingPayment._id,
        invoiceId: selectedInvoice as any,
      });
      setAllocatingPayment(null);
      setSelectedInvoice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (confirm('Mark this payment as refunded?')) {
      await markAsRefunded({ unallocatedPaymentId: paymentId });
    }
  };

  // Filter unallocated payments
  const filteredPayments = unallocated?.filter((payment: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.payerPhone?.includes(query) ||
        payment.payerName?.toLowerCase().includes(query) ||
        payment.reference?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const unmatchedCount = unallocated?.filter((p: any) => p.status === 'unmatched').length || 0;

  if (unallocated === undefined) {
    return <UnallocatedSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unallocated Payments"
        description="Match mobile money payments to invoices"
        actions={
          unmatchedCount > 0 && (
            <Badge variant="outline" className="bg-warning-bg text-warning border-warning-border gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {unmatchedCount} unmatched
            </Badge>
          )
        }
      />

      {/* Search */}
      <div className="flex gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search by phone, name, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-[13px]"
          />
        </div>
      </div>

      {/* Unallocated Payments Table */}
      <SectionCard
        title="Unallocated Payments"
        description={`${filteredPayments?.length || 0} payments waiting to be matched`}
      >
        {filteredPayments && filteredPayments.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Date</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Payer</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Method</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Reference</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Amount</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Status</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {filteredPayments.map((payment: any) => (
                  <TableRow key={payment._id} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[12px] text-text-secondary">
                        {format(new Date(payment.receivedAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        {format(new Date(payment.receivedAt), 'h:mm a')}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{payment.payerName || 'Unknown'}</p>
                      <p className="text-[11px] text-text-secondary font-mono">{payment.payerPhone}</p>
                      {payment.matchedStudentName && (
                        <p className="text-[11px] text-accent mt-0.5">
                          Matched: {payment.matchedStudentName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {PAYMENT_METHODS[payment.method] || payment.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[12px] font-mono text-text-secondary">{payment.reference || '—'}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] font-medium text-text-primary tabular-nums">{formatZMW(payment.amountZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${
                          payment.status === 'unmatched'
                            ? 'bg-warning-bg text-warning border-warning-border'
                            : payment.status === 'refunded'
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-success-bg text-success border-success-border'
                        }`}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {payment.status === 'unmatched' && payment.matchedStudentId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setAllocatingPayment(payment)}
                            title="Allocate to invoice"
                          >
                            <Link2 className="h-4 w-4 text-accent" />
                          </Button>
                        )}
                        {payment.status === 'unmatched' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRefund(payment._id)}
                            title="Mark as refunded"
                          >
                            <RotateCcw className="h-4 w-4 text-error" />
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
            <Empty
              title="No unallocated payments"
              description="All mobile money payments have been matched to invoices"
              icon={Banknote}
            />
          </div>
        )}
      </SectionCard>

      {/* Allocate Dialog */}
      <Dialog open={!!allocatingPayment} onOpenChange={() => { setAllocatingPayment(null); setSelectedInvoice(''); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Allocate Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {allocatingPayment && (
              <div className="p-4 bg-surface-subtle rounded-lg">
                <p className="text-[13px] font-medium text-text-primary">Payment Details</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-[11px] text-text-secondary">Amount</p>
                    <p className="text-[13px] font-medium">{formatZMW(allocatingPayment.amountZMW)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">From</p>
                    <p className="text-[13px]">{allocatingPayment.payerPhone}</p>
                  </div>
                </div>
                {allocatingPayment.matchedStudentName && (
                  <p className="text-[12px] text-accent mt-2">
                    Matched to: {allocatingPayment.matchedStudentName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Select Invoice</Label>
              {studentInvoices && studentInvoices.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {studentInvoices
                    .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'void')
                    .map((invoice: any) => (
                      <button
                        key={invoice._id}
                        onClick={() => setSelectedInvoice(invoice._id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedInvoice === invoice._id
                            ? 'border-accent bg-accent-bg'
                            : 'border-border-panel hover:bg-surface-subtle'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-[13px] text-text-primary">{invoice.invoiceNumber}</p>
                            <p className="text-[12px] text-text-secondary">Balance: {formatZMW(invoice.balanceZMW)}</p>
                          </div>
                          {selectedInvoice === invoice._id && (
                            <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-secondary">No unpaid invoices found for this student</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAllocatingPayment(null); setSelectedInvoice(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={!selectedInvoice || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Allocating...' : 'Allocate Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { api } from '../../../../../convex/_generated/api';

function UnallocatedSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
