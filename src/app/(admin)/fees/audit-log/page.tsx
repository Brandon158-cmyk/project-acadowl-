'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Download, FileText, Receipt, CreditCard, AlertCircle, CheckCircle, Ban, Edit, UserPlus, Trash2, RotateCcw } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { format } from 'date-fns';

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'invoice_created', label: 'Invoice Created' },
  { value: 'invoice_voided', label: 'Invoice Voided' },
  { value: 'payment_recorded', label: 'Payment Recorded' },
  { value: 'payment_reversed', label: 'Payment Reversed' },
  { value: 'credit_note_created', label: 'Credit Note Created' },
  { value: 'scholarship_applied', label: 'Scholarship Applied' },
  { value: 'fee_structure_changed', label: 'Fee Structure Changed' },
];

const ACTION_ICONS: Record<string, any> = {
  invoice_created: FileText,
  invoice_voided: Ban,
  payment_recorded: Receipt,
  payment_reversed: RotateCcw,
  credit_note_created: CreditCard,
  scholarship_applied: UserPlus,
  fee_structure_changed: Edit,
};

const ACTION_COLORS: Record<string, string> = {
  invoice_created: 'bg-info-bg text-info border-info-border',
  invoice_voided: 'bg-error-bg text-error border-error-border',
  payment_recorded: 'bg-success-bg text-success border-success-border',
  payment_reversed: 'bg-warning-bg text-warning border-warning-border',
  credit_note_created: 'bg-accent-bg text-accent border-accent-border',
  scholarship_applied: 'bg-success-bg text-success border-success-border',
  fee_structure_changed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7'); // days

  const auditLog = useQuery(api.fees.auditLog.getAuditLog, {
    limit: 100,
  });

  // Filter log entries
  const filteredLog = auditLog?.filter((entry: any) => {
    if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.performerName?.toLowerCase().includes(query) ||
        entry.studentName?.toLowerCase().includes(query) ||
        entry.invoiceNumber?.toLowerCase().includes(query)
      );
    }
    // Date filter
    const entryDate = new Date(entry.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
    if (entryDate < cutoffDate) return false;
    
    return true;
  });

  // Format action for display
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Generate description
  const getDescription = (entry: any) => {
    const descriptions: Record<string, string> = {
      invoice_created: `Invoice ${entry.invoiceNumber} created for ${entry.studentName} — ${formatZMW(entry.amountZMW || 0)}`,
      invoice_voided: `Invoice ${entry.invoiceNumber} voided for ${entry.studentName}`,
      payment_recorded: `Payment of ${formatZMW(entry.amountZMW || 0)} recorded for ${entry.studentName}`,
      payment_reversed: `Payment reversed for ${entry.studentName}`,
      credit_note_created: `Credit note issued to ${entry.studentName} — ${formatZMW(entry.amountZMW || 0)}`,
      scholarship_applied: `Scholarship applied to ${entry.studentName}`,
      fee_structure_changed: `Fee structure updated`,
    };
    return descriptions[entry.action] || `${formatAction(entry.action)} by ${entry.performerName}`;
  };

  if (auditLog === undefined) {
    return <AuditLogSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Complete history of all financial transactions and changes"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by user, student, or invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-[13px]"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-[13px]">{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px] text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" className="text-[13px]">Last 24 hours</SelectItem>
            <SelectItem value="7" className="text-[13px]">Last 7 days</SelectItem>
            <SelectItem value="30" className="text-[13px]">Last 30 days</SelectItem>
            <SelectItem value="90" className="text-[13px]">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log Table */}
      <SectionCard title="Financial Audit Trail" description={`${filteredLog?.length || 0} entries found`}>
        {filteredLog && filteredLog.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-surface-subtle sticky top-0">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 w-[140px]">Time</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Action</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Description</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {filteredLog.map((entry: any) => {
                  const Icon = ACTION_ICONS[entry.action] || ScrollText;
                  return (
                    <TableRow key={entry._id} className="hover:bg-surface-subtle transition-colors">
                      <TableCell className="px-4 py-3">
                        <p className="text-[12px] text-text-secondary">
                          {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {format(new Date(entry.createdAt), 'h:mm a')}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${ACTION_COLORS[entry.action] || 'bg-gray-100'}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <Badge variant="outline" className={`text-[11px] ${ACTION_COLORS[entry.action]}`}>
                            {formatAction(entry.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <p className="text-[13px] text-text-primary">{getDescription(entry)}</p>
                        {entry.notes && (
                          <p className="text-[11px] text-text-tertiary mt-1">{entry.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <p className="text-[13px] text-text-secondary">{entry.performerName || 'System'}</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty
              title="No audit entries found"
              description={searchQuery || actionFilter !== 'all' ? 'Try adjusting your filters' : 'Audit log will record all financial transactions'}
              icon={ScrollText}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-28" /></div>
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
