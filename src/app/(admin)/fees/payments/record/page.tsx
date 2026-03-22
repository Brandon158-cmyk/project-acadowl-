'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search, Banknote, CreditCard, Landmark, Smartphone, Receipt, Printer } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { cn } from '@/lib/utils';
import { api } from '../../../../../../convex/_generated/api';

type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'airtel_money' | 'mtn_momo';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
  { value: 'cheque', label: 'Cheque', icon: CreditCard },
  { value: 'airtel_money', label: 'Airtel Money', icon: Smartphone },
  { value: 'mtn_momo', label: 'MTN MoMo', icon: Smartphone },
];

export default function RecordPaymentPage() {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [openStudentSearch, setOpenStudentSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const [formData, setFormData] = useState<{
    amountZMW: string;
    method: PaymentMethod;
    reference: string;
    notes: string;
  }>({
    amountZMW: '',
    method: 'cash' as PaymentMethod,
    reference: '',
    notes: '',
  });

  const students = useQuery(
    api.students.queries.searchStudents,
    studentSearch.length >= 2 ? { query: studentSearch, limit: 10 } : 'skip'
  );

  const studentInvoices = useQuery(
    api.fees.invoices.getInvoicesForStudent,
    selectedStudent?._id ? { studentId: selectedStudent._id } : 'skip'
  );

  const recordPayment = useMutation(api.fees.payments.recordManualPayment);

  // Filter to unpaid invoices
  const unpaidInvoices = studentInvoices?.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'void'
  );

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setSelectedInvoice(null);
    setOpenStudentSearch(false);
    setStudentSearch('');
  };

  const handleQuickPay = () => {
    if (selectedInvoice) {
      setFormData({ ...formData, amountZMW: selectedInvoice.balanceZMW.toString() });
    }
  };

  const handleSubmit = async () => {
    if (!selectedInvoice || !formData.amountZMW) return;
    
    setIsSubmitting(true);
    try {
      const result = await recordPayment({
        invoiceId: selectedInvoice._id,
        amountZMW: parseFloat(formData.amountZMW),
        method: formData.method,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });
      
      setPaymentResult(result);
      setShowReceipt(true);
      
      // Reset form
      setFormData({ amountZMW: '', method: 'cash', reference: '', notes: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedBalance = selectedInvoice
    ? selectedInvoice.balanceZMW - (parseFloat(formData.amountZMW) || 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description="Record cash, bank, or mobile money payments"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student & Invoice Selection */}
        <SectionCard title="Student & Invoice" description="Select the student and invoice">
          <div className="p-5 space-y-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Student</Label>
              <Popover open={openStudentSearch} onOpenChange={setOpenStudentSearch}>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudentSearch}
                    className="w-full justify-between text-[13px]"
                  >
                    {selectedStudent ? (
                      <span>
                        {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.studentNumber})
                      </span>
                    ) : (
                      <span className="text-text-tertiary">Search student...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Type student name or number..."
                      value={studentSearch}
                      onValueChange={setStudentSearch}
                      className="text-[13px]"
                    />
                    <CommandList>
                      <CommandEmpty className="text-[13px] p-4">
                        {studentSearch.length < 2 
                          ? 'Type at least 2 characters' 
                          : 'No students found'}
                      </CommandEmpty>
                      <CommandGroup>
                        {students?.map((student) => (
                          <CommandItem
                            key={student._id}
                            value={student._id}
                            onSelect={() => handleStudentSelect(student)}
                            className="text-[13px]"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedStudent?._id === student._id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {student.firstName} {student.lastName}
                            <span className="ml-2 text-text-tertiary">
                              ({student.studentNumber})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Invoice Selection */}
            {selectedStudent && (
              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Invoice</Label>
                {unpaidInvoices !== undefined ? (
                  unpaidInvoices.length > 0 ? (
                    <div className="space-y-2">
                      {unpaidInvoices.map((invoice) => (
                        <button
                          key={invoice._id}
                          onClick={() => setSelectedInvoice(invoice)}
                          className={cn(
                            'w-full p-3 rounded-lg border text-left transition-all',
                            selectedInvoice?._id === invoice._id
                              ? 'border-accent bg-accent-bg'
                              : 'border-border-panel hover:bg-surface-subtle'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-[13px] text-text-primary">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-[12px] text-text-secondary">
                                Balance: {formatZMW(invoice.balanceZMW)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px]',
                                invoice.status === 'overdue' && 'bg-error-bg text-error border-error-border',
                                invoice.status === 'partial' && 'bg-warning-bg text-warning border-warning-border',
                                invoice.status === 'sent' && 'bg-info-bg text-info border-info-border'
                              )}
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty>
                      <EmptyTitle>No unpaid invoices</EmptyTitle>
                      <EmptyDescription>This student has no outstanding invoices</EmptyDescription>
                    </Empty>
                    
                  )
                ) : (
                  <Skeleton className="h-32" />
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Payment Details */}
        <SectionCard title="Payment Details" description="Enter payment information">
          <div className="p-5 space-y-4">
            {/* Current Balance Display */}
            {selectedInvoice && (
              <div className="p-4 bg-surface-subtle rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-text-secondary">Invoice Total</span>
                  <span className="text-[13px] font-medium">{formatZMW(selectedInvoice.totalZMW)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-text-secondary">Already Paid</span>
                  <span className="text-[13px] text-success">{formatZMW(selectedInvoice.paidZMW)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border-inner">
                  <span className="text-[12px] text-text-secondary font-medium">Balance Due</span>
                  <span className="text-[15px] font-semibold text-text-primary">
                    {formatZMW(selectedInvoice.balanceZMW)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-text-secondary">Amount (ZMW)</Label>
                {selectedInvoice && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleQuickPay}
                    className="h-auto py-0 text-[11px] text-accent"
                  >
                    Pay Full Balance
                  </Button>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                value={formData.amountZMW}
                onChange={(e) => setFormData({ ...formData, amountZMW: e.target.value })}
                placeholder="0.00"
                className="text-[13px]"
                disabled={!selectedInvoice}
              />
            </div>

            {/* Running Balance Preview */}
            {formData.amountZMW && selectedInvoice && (
              <div className="p-3 bg-accent-bg rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-accent-text">Balance After Payment</span>
                  <span className={cn(
                    'text-[15px] font-semibold',
                    calculatedBalance <= 0 ? 'text-success' : 'text-warning'
                  )}>
                    {formatZMW(Math.max(0, calculatedBalance))}
                  </span>
                </div>
                {calculatedBalance < 0 && (
                  <p className="text-[11px] text-warning mt-1">
                    Overpayment of {formatZMW(Math.abs(calculatedBalance))} will create credit
                  </p>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(v) => v && setFormData({ ...formData, method: v as PaymentMethod })}
                disabled={!selectedInvoice}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value} className="text-[13px]">
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">
                Reference {formData.method !== 'cash' && '(Required)'}
              </Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder={
                  formData.method === 'bank_transfer' 
                    ? 'Bank reference number' 
                    : formData.method === 'cheque'
                    ? 'Cheque number'
                    : 'Reference (optional)'
                }
                className="text-[13px]"
                disabled={!selectedInvoice}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this payment"
                className="text-[13px]"
                disabled={!selectedInvoice}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedInvoice ||
                !formData.amountZMW ||
                parseFloat(formData.amountZMW) <= 0 ||
                (formData.method !== 'cash' && !formData.reference) ||
                isSubmitting
              }
              className="w-full bg-accent hover:bg-accent-hover gap-2"
            >
              <Banknote className="h-4 w-4" />
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* Receipt Dialog */}
      {showReceipt && paymentResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-text-primary">Payment Recorded</h3>
                <p className="text-[13px] text-text-secondary mt-1">
                  Receipt {paymentResult.receiptNumber}
                </p>
              </div>
              <div className="p-4 bg-surface-subtle rounded-lg text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[12px] text-text-secondary">Amount</span>
                  <span className="text-[13px] font-medium">{formatZMW(parseFloat(formData.amountZMW))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-text-secondary">Method</span>
                  <span className="text-[13px] capitalize">{formData.method.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-text-secondary">New Balance</span>
                  <span className="text-[13px] font-medium">{formatZMW(Math.max(0, calculatedBalance))}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceipt(false);
                    setSelectedInvoice(null);
                    setFormData({ amountZMW: '', method: 'cash', reference: '', notes: '' });
                  }}
                  className="flex-1"
                >
                  Record Another
                </Button>
                <Button
                  onClick={() => window.open(paymentResult.receiptPdfUrl, '_blank')}
                  className="flex-1 bg-accent hover:bg-accent-hover gap-2"
                  disabled={!paymentResult.receiptPdfUrl}
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
