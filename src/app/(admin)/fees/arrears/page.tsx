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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Send, FileText, Mail, Bell } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../../../../convex/_generated/api';

const ARREARS_BUCKETS = [
  { key: 'current', label: 'Current', color: 'bg-success', textColor: 'text-success' },
  { key: 'overdue_30', label: '30 Days', color: 'bg-warning', textColor: 'text-warning' },
  { key: 'overdue_60', label: '60 Days', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { key: 'overdue_90_plus', label: '90+ Days', color: 'bg-error', textColor: 'text-error' },
];

export default function ArrearsPage() {
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('all');

  const arrears = useQuery(api.fees.arrears.getArrearsReport, { termId: undefined });
  const grades = useQuery(api.grades.getGrades);
  const sendReminder = useMutation(api.fees.arrears.sendReminders);

  const handleSendReminder = async (studentId: string, type: string) => {
    await sendReminder({ studentIds: [studentId as any] });
  };

  const handleBulkReminders = async (bucket: string) => {
    const studentsInBucket = filteredArrears?.filter(a => a.bucket === bucket).map(a => a.studentId) || [];
    if (studentsInBucket.length > 0) {
      await sendReminder({ studentIds: studentsInBucket as any });
    }
  };

  // Filter and bucket arrears
  const filteredArrears = arrears?.students?.filter((item: any) => {
    if (gradeFilter !== 'all' && item.gradeId !== gradeFilter) return false;
    if (selectedBucket !== 'all' && item.bucket !== selectedBucket) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.studentName?.toLowerCase().includes(query) ||
        item.guardianPhone?.includes(query)
      );
    }
    return true;
  });

  // Calculate bucket totals from byBucket data
  const bucketTotals = ARREARS_BUCKETS.map(bucket => {
    const bucketData = arrears?.byBucket?.[bucket.key];
    return { ...bucket, count: bucketData?.count || 0, total: bucketData?.totalZMW || 0 };
  });

  if (arrears === undefined) {
    return <ArrearsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Arrears"
        description="Track and manage overdue fee payments"
        actions={
          <Button 
            onClick={() => handleBulkReminders('overdue_30')}
            className="gap-2 bg-accent hover:bg-accent-hover"
          >
            <Mail className="h-4 w-4" />
            Send Bulk Reminders
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {bucketTotals.map((bucket) => (
          <button
            key={bucket.key}
            onClick={() => setSelectedBucket(selectedBucket === bucket.key ? 'all' : bucket.key)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedBucket === bucket.key 
                ? 'border-accent bg-accent-bg' 
                : 'border-border-panel bg-white hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${bucket.color}`} />
              <span className="text-[12px] text-text-secondary">{bucket.label}</span>
            </div>
            <p className={`text-[20px] font-semibold ${bucket.textColor}`}>
              {formatZMW(bucket.total)}
            </p>
            <p className="text-[12px] text-text-tertiary">{bucket.count} students</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search student or guardian phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-[13px]"
          />
        </div>
        <Select value={gradeFilter} onValueChange={(value) => setGradeFilter(value || 'all')}>
          <SelectTrigger className="w-[160px] text-[13px]">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Grades</SelectItem>
            {grades?.map((g) => (
              <SelectItem key={g._id} value={g._id} className="text-[13px]">{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Arrears Table */}
      <SectionCard title="Outstanding Balances" description={`${filteredArrears?.length || 0} students with arrears`}>
        {filteredArrears && filteredArrears.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Guardian Phone</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Days Overdue</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Balance</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Last Reminder</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {filteredArrears.map((item) => (
                  <TableRow key={item.studentId} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{item.studentName}</p>
                      <p className="text-[11px] text-text-tertiary">{item.gradeName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-secondary font-mono">{item.guardianPhone}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className={`text-[11px] ${
                        item.daysOverdue > 60 ? 'bg-error-bg text-error border-error-border' :
                        item.daysOverdue > 30 ? 'bg-warning-bg text-warning border-warning-border' :
                        'bg-info-bg text-info border-info-border'
                      }`}>
                        {item.daysOverdue} days
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] font-semibold text-error tabular-nums">{formatZMW(item.balanceZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {item.lastReminderSent ? (
                        <span className="text-[12px] text-text-secondary">
                          {formatDistanceToNow(item.lastReminderSent, { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-[12px] text-text-tertiary">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSendReminder(item.studentId, 'sms')}
                          title="Send SMS reminder"
                        >
                          <Mail className="h-4 w-4 text-accent" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSendReminder(item.studentId, 'app')}
                          title="Send in-app notification"
                        >
                          <Bell className="h-4 w-4 text-warning" />
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
            <Empty>
              <EmptyTitle>No arrears found</EmptyTitle>
              <EmptyDescription>{searchQuery || selectedBucket !== 'all' ? 'Try adjusting filters' : 'All students are up to date on payments'}</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ArrearsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-20" />
      <Skeleton className="h-96" />
    </div>
  );
}
