'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, FileText, Check, ChevronsUpDown, Search, Download, CreditCard } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { cn } from '@/lib/utils';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const CREDIT_NOTE_TYPES = [
  { value: 'correction', label: 'Invoice Correction' },
  { value: 'refund', label: 'Refund' },
  { value: 'scholarship', label: 'Scholarship Adjustment' },
  { value: 'boarding_change', label: 'Boarding Status Change' },
  { value: 'withdrawal', label: 'Withdrawal/Transfer' },
];

export default function CreditNotesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    amountZMW: '',
    reason: '',
    type: 'correction' as const,
    applyToInvoiceId: '',
  });

  const creditNotes = useQuery(api.fees.creditNotes.getCreditNotes, { limit: 100 });
  const students = useQuery(
    api.students.queries.searchStudents,
    studentSearch.length >= 2 ? { query: studentSearch, limit: 10 } : 'skip'
  );
  const studentInvoices = useQuery(
    api.fees.invoices.getInvoicesForStudent,
    selectedStudent?._id ? { studentId: selectedStudent._id } : 'skip'
  );

  const createCreditNote = useMutation(api.fees.creditNotes.createCreditNote);

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setFormData({ ...formData, studentId: student._id, applyToInvoiceId: '' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const invoiceId = formData.applyToInvoiceId || undefined;
      if (!invoiceId) {
        throw new Error('Please select an invoice to apply the credit note to');
      }
      await createCreditNote({
        invoiceId: invoiceId as Id<'invoices'>,
        amountZMW: parseFloat(formData.amountZMW),
        reason: formData.reason,
        type: formData.type,
      });
      setIsAddOpen(false);
      setSelectedStudent(null);
      setFormData({ studentId: '', amountZMW: '', reason: '', type: 'correction', applyToInvoiceId: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (creditNotes === undefined) {
    return <CreditNotesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        description="Issue credits and adjustments to student accounts"
        actions={
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-accent hover:bg-accent-hover">
            <Plus className="h-4 w-4" />
            Issue Credit Note
          </Button>
        }
      />

      <SectionCard title="Credit Note History" description="All issued credits and adjustments">
        {creditNotes.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Credit #</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Type</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Amount</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Status</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {creditNotes.map((note) => (
                  <TableRow key={note._id} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="font-mono text-[13px] text-text-primary">{note.creditNoteNumber}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{note.studentName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {note.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] font-medium text-success tabular-nums">{formatZMW(note.amountZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={`text-[11px] ${
                        note.remainingZMW > 0 
                          ? 'bg-success-bg text-success border-success-border' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {note.remainingZMW > 0 ? `Available: ${formatZMW(note.remainingZMW)}` : 'Fully Used'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4 text-text-secondary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty>
              <EmptyTitle>No credit notes</EmptyTitle>
              <EmptyDescription>Issue credits for corrections, refunds, or adjustments</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Issue Credit Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Student</Label>
              <Popover>
                <PopoverTrigger>
                  <Button variant="outline" className="w-full justify-between text-[13px]">
                    {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Search student...'}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Type student name..." 
                      value={studentSearch}
                      onValueChange={setStudentSearch}
                      className="text-[13px]"
                    />
                    <CommandList>
                      <CommandEmpty className="text-[13px] p-4">
                        {studentSearch.length < 2 ? 'Type at least 2 characters' : 'No students found'}
                      </CommandEmpty>
                      <CommandGroup>
                        {students?.map((student) => (
                          <CommandItem
                            key={student._id}
                            onSelect={() => handleStudentSelect(student)}
                            className="text-[13px]"
                          >
                            <Check className={cn('mr-2 h-4 w-4', selectedStudent?._id === student._id ? 'opacity-100' : 'opacity-0')} />
                            {student.firstName} {student.lastName} ({student.studentNumber})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedStudent && studentInvoices && studentInvoices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Apply to Invoice (Optional)</Label>
                <Select
                  value={formData.applyToInvoiceId}
                  onValueChange={(v) => setFormData({ ...formData, applyToInvoiceId: v || '' })}
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select invoice or leave blank for credit balance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-[13px]">Credit Balance (no specific invoice)</SelectItem>
                    {studentInvoices.filter(i => i.status !== 'paid' && i.status !== 'void').map((inv) => (
                      <SelectItem key={inv._id} value={inv._id} className="text-[13px]">
                        {inv.invoiceNumber} — Balance: {formatZMW(inv.balanceZMW)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Credit Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v: any) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-[13px]">
                      {type.label}
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
                value={formData.amountZMW}
                onChange={(e) => setFormData({ ...formData, amountZMW: e.target.value })}
                placeholder="0.00"
                className="text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Reason</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain the reason for this credit"
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStudent || !formData.amountZMW || !formData.reason || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Issuing...' : 'Issue Credit Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreditNotesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-36" /></div>
      <Skeleton className="h-96" />
    </div>
  );
}
