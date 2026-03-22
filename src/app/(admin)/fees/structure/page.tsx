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
import { Empty } from '@/components/ui/empty';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit2, Trash2, Copy, Home, Building2, Users } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { api } from '../../../../../convex/_generated/api';

const BOARDING_OPTIONS = [
  { value: 'day', label: 'Day Scholars', icon: Home },
  { value: 'boarding', label: 'Boarders', icon: Building2 },
  { value: 'all', label: 'All Students', icon: Users },
];

export default function FeeStructurePage() {
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const terms = useQuery(api.terms.getActiveTerms);
  const grades = useQuery(api.grades.getGrades);
  const structures = useQuery(
    api.fees.structures.getFeeStructuresForTermAndGrade,
    selectedTermId && selectedGradeId ? { termId: selectedTermId as any, gradeId: selectedGradeId as any } : 'skip'
  );
  const feeTypes = useQuery(api.fees.feeTypes.getFeeTypes);

  const createStructure = useMutation(api.fees.structures.createFeeStructure);
  const updateStructure = useMutation(api.fees.structures.updateFeeStructure);
  const deleteStructure = useMutation(api.fees.structures.deleteFeeStructure);
  const copyToTerm = useMutation(api.fees.structures.copyFeeStructureToTerm);

  const [formData, setFormData] = useState({
    termId: '',
    gradeId: '',
    feeTypeId: '',
    boardingStatus: 'day' as const,
    amountZMW: '',
    notes: '',
    instalmentSchedule: [] as any[],
  });

  const handleAdd = async () => {
    setIsSubmitting(true);
    try {
      await createStructure({
        ...formData,
        termId: formData.termId as any,
        gradeId: formData.gradeId as any,
        feeTypeId: formData.feeTypeId,
        amountZMW: parseFloat(formData.amountZMW),
        instalmentSchedule: formData.instalmentSchedule.length > 0 ? formData.instalmentSchedule : undefined,
      });
      setIsAddDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      termId: selectedTermId || '',
      gradeId: selectedGradeId || '',
      feeTypeId: '',
      boardingStatus: 'day',
      amountZMW: '',
      notes: '',
      instalmentSchedule: [],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      await deleteStructure({ feeStructureId: id as any });
    }
  };

  const handleCopyToTerm = async (structureId: string, targetTermId: string) => {
    await copyToTerm({ sourceStructureId: structureId as any, targetTermId: targetTermId as any });
  };

  if (terms === undefined || grades === undefined) {
    return <FeeStructureSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Structure"
        description="Configure fees per term, grade, and boarding status"
        actions={
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="gap-2 bg-accent hover:bg-accent-hover"
            disabled={!selectedTermId || !selectedGradeId}
          >
            <Plus className="h-4 w-4" />
            Add Fee Item
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <div className="grid gap-2">
          <Label className="text-[12px] text-text-secondary">Term</Label>
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-[200px] text-[13px]">
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
        </div>
        <div className="grid gap-2">
          <Label className="text-[12px] text-text-secondary">Grade</Label>
          <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
            <SelectTrigger className="w-[200px] text-[13px]">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">All Grades (School-wide)</SelectItem>
              {grades?.map((grade) => (
                <SelectItem key={grade._id} value={grade._id} className="text-[13px]">
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee Structures Table */}
      <SectionCard
        title="Fee Structure Items"
        description={
          selectedTermId && selectedGradeId
            ? `Configured fees for selected term and grade`
            : 'Select a term and grade to view fee structure'
        }
      >
        {selectedTermId && selectedGradeId ? (
          structures !== undefined ? (
            structures.length > 0 ? (
              <div className="border border-border-panel rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-surface-subtle">
                    <TableRow className="border-b border-border-inner hover:bg-transparent">
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Fee Type
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Boarding
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Amount (ZMW)
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                        Instalments
                      </TableHead>
                      <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border-row bg-white">
                    {structures.map((structure) => (
                      <TableRow
                        key={structure._id}
                        className="hover:bg-surface-subtle transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          <p className="text-[13px] font-medium text-text-primary">
                            {structure.feeTypeId}
                          </p>
                          {structure.notes && (
                            <p className="text-[11px] text-text-tertiary">{structure.notes}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {structure.boardingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] font-medium text-text-primary tabular-nums">
                            {formatZMW(structure.amountZMW)}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {structure.instalmentSchedule && structure.instalmentSchedule.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="instalments" className="border-0">
                                <AccordionTrigger className="py-0 text-[12px] text-accent hover:no-underline">
                                  {structure.instalmentSchedule.length} instalments
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-1 pt-2">
                                    {structure.instalmentSchedule.map((inst: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-[12px]">
                                        <span className="text-text-secondary">{inst.label}</span>
                                        <span className="text-text-primary tabular-nums">
                                          {formatZMW(inst.amountZMW)} by {inst.dueDate}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ) : (
                            <span className="text-[12px] text-text-tertiary">Full payment</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Copy to another term"
                            >
                              <Copy className="h-4 w-4 text-text-secondary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(structure._id)}
                            >
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
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
                  title="No fee items configured"
                  description="Add fee items for this term and grade"
                  icon={Plus}
                  action={
                    <Button
                      onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(true);
                      }}
                      className="gap-2 bg-accent hover:bg-accent-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Fee Item
                    </Button>
                  }
                />
              </div>
            )
          ) : (
            <Skeleton className="h-64" />
          )
        ) : (
          <div className="py-12 text-center">
            <p className="text-[13px] text-text-secondary">
              Select a term and grade to view fee structure
            </p>
          </div>
        )}
      </SectionCard>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Add Fee Structure Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[12px] text-text-secondary">Term</Label>
                <Select
                  value={formData.termId}
                  onValueChange={(v) => setFormData({ ...formData, termId: v })}
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {terms?.map((t) => (
                      <SelectItem key={t._id} value={t._id} className="text-[13px]">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[12px] text-text-secondary">Grade</Label>
                <Select
                  value={formData.gradeId}
                  onValueChange={(v) => setFormData({ ...formData, gradeId: v })}
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[13px]">School-wide</SelectItem>
                    {grades?.map((g) => (
                      <SelectItem key={g._id} value={g._id} className="text-[13px]">
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[12px] text-text-secondary">Fee Type</Label>
              <Select
                value={formData.feeTypeId}
                onValueChange={(v) => setFormData({ ...formData, feeTypeId: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue placeholder="Select fee type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes?.filter((ft) => ft.isActive).map((ft) => (
                    <SelectItem key={ft.id} value={ft.id} className="text-[13px]">
                      {ft.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[12px] text-text-secondary">Applies To</Label>
              <Select
                value={formData.boardingStatus}
                onValueChange={(v: any) => setFormData({ ...formData, boardingStatus: v })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARDING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Label className="text-[12px] text-text-secondary">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formData.feeTypeId || !formData.amountZMW || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Adding...' : 'Add Fee Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeStructureSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
