'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Receipt, 
  Banknote, 
  CreditCard, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Download,
  Plus,
  History,
  Award
} from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import Link from 'next/link';

interface StudentFinanceTabProps {
  studentId: string;
}

export default function StudentFinanceTab({ studentId }: StudentFinanceTabProps) {
  const [activeTab, setActiveTab] = useState('invoices');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    method: 'cash' as const,
    reference: '',
  });

  const studentLedger = useQuery(
    api.fees.ledger.getStudentLedger,
    { studentId: studentId as any }
  );
  const invoices = useQuery(
    api.fees.invoices.getInvoicesForStudent,
    { studentId: studentId as any }
  );
  const creditNotes = useQuery(
    api.fees.creditNotes.getCreditNotesForStudent,
    { studentId: studentId as any }
  );
  const scholarships = useQuery(
    api.fees.scholarships.getActiveScholarshipsForStudent,
    { studentId: studentId as any }
  );

  const recordPayment = useMutation(api.fees.payments.recordManualPayment);

  const handleRecordPayment = async () => {
    if (!paymentForm.invoiceId || !paymentForm.amount) return;
    setIsSubmitting(true);
    try {
      await recordPayment({
        invoiceId: paymentForm.invoiceId as any,
        amountZMW: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
      });
      setIsPaymentDialogOpen(false);
      setPaymentForm({ invoiceId: '', amount: '', method: 'cash', reference: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate balance color
  const balance = studentLedger?.balance || 0;
  const balanceColor = balance === 0 ? 'text-success' : balance < 5000 ? 'text-warning' : 'text-error';
  const balanceBg = balance === 0 ? 'bg-success-bg border-success-border' : balance < 5000 ? 'bg-warning-bg border-warning-border' : 'bg-error-bg border-error-border';

  // Get unpaid invoices for payment dropdown
  const unpaidInvoices = invoices?.filter((inv: any) => inv.status !== 'paid' && inv.status !== 'void') || [];

  if (!studentLedger || !invoices) {
    return <StudentFinanceSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className={`border ${balanceBg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-text-secondary">Current Balance</p>
              <p className={`text-[36px] font-bold ${balanceColor} mt-1`}>
                {formatZMW(balance)}
              </p>
              <p className="text-[12px] text-text-secondary mt-1">
                {balance === 0 ? 'All fees cleared' : balance < 5000 ? 'Partially paid' : 'Outstanding balance'}
              </p>
            </div>
            <div className="flex gap-2">
              {balance > 0 && (
                <Button 
                  onClick={() => setIsPaymentDialogOpen(true)}
                  className="gap-2 bg-accent hover:bg-accent-hover"
                >
                  <Banknote className="h-4 w-4" />
                  Record Payment
                </Button>
              )}
              {balance === 0 && (
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Clearance Certificate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-border-panel">
          <TabsTrigger value="invoices" className="gap-2 text-[13px]">
            <Receipt className="h-4 w-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2 text-[13px]">
            <History className="h-4 w-4" />
            Ledger
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2 text-[13px]">
            <CreditCard className="h-4 w-4" />
            Credits ({creditNotes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="gap-2 text-[13px]">
            <Award className="h-4 w-4" />
            Scholarships ({scholarships?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card className="border-border-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="border border-border-panel rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-surface-subtle">
                      <TableRow className="border-b border-border-inner hover:bg-transparent">
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2">Invoice #</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2">Term</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Total</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Paid</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Balance</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2">Status</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-row">
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice._id} className="hover:bg-surface-subtle">
                          <TableCell className="px-4 py-2.5">
                            <Link href={`/fees/invoices/${invoice._id}`} className="font-mono text-[13px] text-accent hover:underline">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-2.5">
                            <p className="text-[13px] text-text-primary">{invoice.termName}</p>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            <p className="text-[13px] tabular-nums">{formatZMW(invoice.totalZMW)}</p>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            <p className="text-[13px] text-success tabular-nums">{formatZMW(invoice.paidZMW)}</p>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            <p className={`text-[13px] font-medium tabular-nums ${invoice.balanceZMW > 0 ? 'text-error' : 'text-success'}`}>
                              {formatZMW(invoice.balanceZMW)}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-2.5">
                            <Badge variant="outline" className={`text-[11px] ${
                              invoice.status === 'paid' ? 'bg-success-bg text-success border-success-border' :
                              invoice.status === 'partial' ? 'bg-warning-bg text-warning border-warning-border' :
                              invoice.status === 'overdue' ? 'bg-error-bg text-error border-error-border' :
                              'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            {invoice.pdfUrl && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                                <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 text-text-secondary" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty title="No invoices" description="No fee invoices for this student" icon={Receipt} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="mt-4">
          <Card className="border-border-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {studentLedger.entries && studentLedger.entries.length > 0 ? (
                <div className="border border-border-panel rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-surface-subtle">
                      <TableRow className="border-b border-border-inner hover:bg-transparent">
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2">Date</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2">Description</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Debit</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Credit</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-2 text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-row">
                      {studentLedger.entries.map((entry: any, index: number) => (
                        <TableRow key={index} className="hover:bg-surface-subtle">
                          <TableCell className="px-4 py-2.5">
                            <p className="text-[12px] text-text-secondary">
                              {new Date(entry.createdAt).toLocaleDateString('en-ZM')}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-2.5">
                            <p className="text-[13px] text-text-primary">{entry.description}</p>
                            {entry.reference && (
                              <p className="text-[11px] text-text-tertiary font-mono">{entry.reference}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            {entry.debit > 0 && (
                              <p className="text-[13px] text-error tabular-nums">{formatZMW(entry.debit)}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            {entry.credit > 0 && (
                              <p className="text-[13px] text-success tabular-nums">{formatZMW(entry.credit)}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right">
                            <p className="text-[13px] font-medium tabular-nums">{formatZMW(entry.balance)}</p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty title="No transactions" description="No ledger entries for this student" icon={History} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="mt-4">
          <Card className="border-border-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Credit Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {creditNotes && creditNotes.length > 0 ? (
                <div className="space-y-3">
                  {creditNotes.map((note: any) => (
                    <div key={note._id} className="flex items-center justify-between p-4 bg-surface-subtle rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-[13px] text-text-primary">{note.creditNoteNumber}</p>
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {note.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-text-secondary mt-1">{note.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[15px] font-semibold text-success">{formatZMW(note.amountZMW)}</p>
                        <p className="text-[11px] text-text-tertiary">
                          {note.remainingZMW > 0 ? `${formatZMW(note.remainingZMW)} available` : 'Fully used'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="No credit notes" description="No credits issued to this student" icon={CreditCard} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scholarships Tab */}
        <TabsContent value="scholarships" className="mt-4">
          <Card className="border-border-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold">Active Scholarships</CardTitle>
            </CardHeader>
            <CardContent>
              {scholarships && scholarships.length > 0 ? (
                <div className="space-y-3">
                  {scholarships.map((scholarship: any) => (
                    <div key={scholarship._id} className="flex items-center justify-between p-4 bg-accent-bg rounded-lg border border-accent-border">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-[14px] font-medium text-text-primary">{scholarship.name}</p>
                          {scholarship.provider && (
                            <p className="text-[12px] text-text-secondary">Provided by {scholarship.provider}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-accent text-white">
                        {scholarship.discountType === 'full' ? '100% Full' :
                         scholarship.discountType === 'partial_percent' ? `${scholarship.discountPercent}% Off` :
                         formatZMW(scholarship.discountAmountZMW || 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="No scholarships" description="No active scholarships for this student" icon={GraduationCap} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Select Invoice</Label>
              <Select
                value={paymentForm.invoiceId}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, invoiceId: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue placeholder="Choose an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidInvoices.map((inv: any) => (
                    <SelectItem key={inv._id} value={inv._id} className="text-[13px]">
                      {inv.invoiceNumber} — Balance: {formatZMW(inv.balanceZMW)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Amount (ZMW)</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0.00"
                className="text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Payment Method</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(v: any) => setPaymentForm({ ...paymentForm, method: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="text-[13px]">Cash</SelectItem>
                  <SelectItem value="bank_transfer" className="text-[13px]">Bank Transfer</SelectItem>
                  <SelectItem value="cheque" className="text-[13px]">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Reference (Optional)</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Receipt or reference number"
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRecordPayment}
              disabled={!paymentForm.invoiceId || !paymentForm.amount || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Label } from '@/components/ui/label';

function StudentFinanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64" />
    </div>
  );
}
