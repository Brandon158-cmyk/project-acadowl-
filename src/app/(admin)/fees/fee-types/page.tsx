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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';

const VAT_CATEGORIES = [
  { value: 'exempt', label: 'VAT Exempt (Education)' },
  { value: 'standard', label: 'Standard Rate (16%)' },
  { value: 'zero_rated', label: 'Zero Rated' },
  { value: 'levy', label: 'Levy (Development)' },
];

export default function FeeTypesPage() {
  const feeTypes = useQuery(api.fees.feeTypes.getFeeTypes);
  const addFeeType = useMutation(api.fees.feeTypes.addFeeType);
  const updateFeeType = useMutation(api.fees.feeTypes.updateFeeType);
  const deactivateFeeType = useMutation(api.fees.feeTypes.deactivateFeeType);
  const seedDefaults = useMutation(api.fees.feeTypes.seedDefaultFeeTypes);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeeType, setEditingFeeType] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isRecurring: true,
    zraVatCategory: 'exempt' as const,
  });

  const handleAdd = async () => {
    setIsSubmitting(true);
    try {
      await addFeeType(formData);
      setIsAddDialogOpen(false);
      setFormData({ name: '', description: '', isRecurring: true, zraVatCategory: 'exempt' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFeeType) return;
    setIsSubmitting(true);
    try {
      await updateFeeType({
        feeTypeId: editingFeeType.id,
        ...formData,
      });
      setEditingFeeType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (feeType: any) => {
    await updateFeeType({
      feeTypeId: feeType.id,
      isActive: !feeType.isActive,
    });
  };

  const handleSeedDefaults = async () => {
    await seedDefaults();
  };

  const openEditDialog = (feeType: any) => {
    setEditingFeeType(feeType);
    setFormData({
      name: feeType.name,
      description: feeType.description || '',
      isRecurring: feeType.isRecurring,
      zraVatCategory: feeType.zraVatCategory,
    });
  };

  if (feeTypes === undefined) {
    return <FeeTypesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Types"
        description="Define the fee categories used across all fee structures"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSeedDefaults}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Seed Defaults
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 bg-accent hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add Fee Type
            </Button>
          </div>
        }
      />

      <SectionCard
        title="All Fee Types"
        description="Manage fee categories for your school"
      >
        {feeTypes.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Name
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Description
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    VAT Category
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">
                    Type
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
                {feeTypes.map((feeType) => (
                  <TableRow
                    key={feeType.id}
                    className="hover:bg-surface-subtle transition-colors"
                  >
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">
                        {feeType.name}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-secondary">
                        {feeType.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[11px] capitalize"
                      >
                        {feeType.zraVatCategory.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={feeType.isRecurring ? 'default' : 'secondary'}
                        className="text-[11px]"
                      >
                        {feeType.isRecurring ? 'Recurring' : 'One-time'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={feeType.isActive}
                          onCheckedChange={() => handleToggleActive(feeType)}
                        />
                        <span
                          className={`text-[12px] ${
                            feeType.isActive ? 'text-success' : 'text-text-tertiary'
                          }`}
                        >
                          {feeType.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(feeType)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4 text-text-secondary" />
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
              title="No fee types defined"
              description="Create fee types like Tuition, Development Levy, Boarding, etc."
              icon={Plus}
              action={
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gap-2 bg-accent hover:bg-accent-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add Fee Type
                </Button>
              }
            />
          </div>
        )}
      </SectionCard>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Add Fee Type</DialogTitle>
          </DialogHeader>
          <FeeTypeForm
            formData={formData}
            setFormData={setFormData}
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formData.name || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Adding...' : 'Add Fee Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingFeeType} onOpenChange={() => setEditingFeeType(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Edit Fee Type</DialogTitle>
          </DialogHeader>
          <FeeTypeForm
            formData={formData}
            setFormData={setFormData}
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingFeeType(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || isSubmitting}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeTypeForm({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-[12px] font-medium text-text-secondary">
          Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Tuition Fee"
          className="text-[13px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description" className="text-[12px] font-medium text-text-secondary">
          Description
        </Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
          className="text-[13px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="vatCategory" className="text-[12px] font-medium text-text-secondary">
          VAT Category
        </Label>
        <Select
          value={formData.zraVatCategory}
          onValueChange={(value) => setFormData({ ...formData, zraVatCategory: value })}
        >
          <SelectTrigger className="text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VAT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="text-[13px]">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isRecurring}
          onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
          id="isRecurring"
        />
        <Label htmlFor="isRecurring" className="text-[13px] cursor-pointer">
          Recurring fee (charged every term)
        </Label>
      </div>
    </div>
  );
}

function FeeTypesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
