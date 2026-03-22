'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, GraduationCap, Check, ChevronsUpDown } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { cn } from '@/lib/utils';
import { api } from '../../../../../convex/_generated/api';

const DISCOUNT_TYPES = [
  { value: 'full', label: '100% Full Scholarship' },
  { value: 'partial_percent', label: 'Percentage Discount' },
  { value: 'partial_fixed', label: 'Fixed Amount Discount' },
];

export default function ScholarshipsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    provider: '',
    discountType: 'full' as 'full' | 'partial_percent' | 'partial_fixed',
    discountPercent: 100,
    discountAmountZMW: '',
    applicableFeeTypes: [] as string[],
    startDate: '',
    endDate: '',
    notes: '',
  });

  const scholarships = useQuery(api.fees.scholarships.getScholarships, { limit: 100 });
  const students = useQuery(
    api.students.queries.searchStudents,
    studentSearch.length >= 2 ? { query: studentSearch, limit: 10 } : 'skip'
  );
  const feeTypes = useQuery(api.fees.feeTypes.getFeeTypes);

  const createScholarship = useMutation(api.fees.scholarships.createScholarship);
  const deactivateScholarship = useMutation(api.fees.scholarships.deactivateScholarship);

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setFormData({ ...formData, studentId: student._id });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createScholarship({
        studentId: formData.studentId as any,
        name: formData.name,
        provider: formData.provider || undefined,
        discountType: formData.discountType,
        discountPercent: formData.discountType === 'partial_percent' ? formData.discountPercent : undefined,
        discountAmountZMW: formData.discountType === 'partial_fixed' ? parseFloat(formData.discountAmountZMW) : undefined,
        applicableFeeTypes: formData.applicableFeeTypes.length > 0 ? formData.applicableFeeTypes : undefined,
        startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
        notes: formData.notes || undefined,
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      studentId: '',
      name: '',
      provider: '',
      discountType: 'full',
      discountPercent: 100,
      discountAmountZMW: '',
      applicableFeeTypes: [],
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Deactivate this scholarship?')) {
      await deactivateScholarship({ scholarshipId: id as any });
    }
  };

  if (scholarships === undefined) {
    return <ScholarshipsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarships"
        description="Manage student scholarships and fee waivers"
        actions={
          <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="gap-2 bg-accent hover:bg-accent-hover">
            <Plus className="h-4 w-4" />
            Add Scholarship
          </Button>
        }
      />

      <SectionCard title="Active Scholarships" description={`${scholarships.length} scholarships`}>
        {scholarships.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Scholarship</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Provider</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Discount</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Status</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {scholarships.map((scholarship: any) => (
                  <TableRow key={scholarship._id} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{scholarship.studentName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-primary">{scholarship.name}</p>
                      {scholarship.notes && (
                        <p className="text-[11px] text-text-tertiary">{scholarship.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-secondary">{scholarship.provider || '—'}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px]">
                        {scholarship.discountType === 'full' && '100% Full'}
                        {scholarship.discountType === 'partial_percent' && `${scholarship.discountPercent}% Off`}
                        {scholarship.discountType === 'partial_fixed' && formatZMW(scholarship.discountAmountZMW || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={`text-[11px] ${
                        scholarship.isActive 
                          ? 'bg-success-bg text-success border-success-border' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {scholarship.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {scholarship.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(scholarship._id)}
                          className="text-[12px] text-error hover:text-error"
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty>
              <EmptyTitle>No scholarships</EmptyTitle>
              <EmptyDescription>Add scholarships for students</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={() => { setIsAddOpen(false); resetForm(); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Add Scholarship</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Student Search */}
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
                            {student.firstName} {student.lastName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Scholarship Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Academic Excellence Scholarship"
                className="text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Provider (Optional)</Label>
              <Input
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., Ministry of Education"
                className="text-[13px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Discount Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-[13px]">{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.discountType === 'partial_percent' && (
              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Discount Percentage</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  className="text-[13px]"
                />
              </div>
            )}

            {formData.discountType === 'partial_fixed' && (
              <div className="space-y-2">
                <Label className="text-[12px] text-text-secondary">Discount Amount (ZMW)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountAmountZMW}
                  onChange={(e) => setFormData({ ...formData, discountAmountZMW: e.target.value })}
                  placeholder="0.00"
                  className="text-[13px]"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[12px] text-text-secondary">Notes (Optional)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedStudent || !formData.name || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Adding...' : 'Add Scholarship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScholarshipsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-36" /></div>
      <Skeleton className="h-96" />
    </div>
  );
}
