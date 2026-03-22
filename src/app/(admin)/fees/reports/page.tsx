'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  ChevronDown, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  CreditCard, 
  Users,
  FileSpreadsheet,
  Printer,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

export default function ReportsPage() {
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('summary');

  const terms = useQuery(api.terms.getActiveTerms);
  const summaryReport = useQuery(
    api.fees.reports.getTermFinancialSummaryReport,
    selectedTermId ? { termId: selectedTermId as Id<'terms'> } : 'skip'
  );
  const outstandingReport = useQuery(
    api.fees.reports.getOutstandingBalancesReport,
    selectedTermId ? { termId: selectedTermId as Id<'terms'>, limit: 50 } : 'skip'
  );

  if (terms === undefined) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Reports"
        description="Comprehensive financial reports and statements"
      />

      {/* Term Selector */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <Select 
          value={selectedTermId} 
          onValueChange={(val) => setSelectedTermId(val ?? '')}
        >
          <SelectTrigger className="w-[240px] text-[13px]">
            <SelectValue placeholder="Select term to view reports" />
          </SelectTrigger>
          <SelectContent>
            {terms?.map((term) => (
              <SelectItem key={term._id} value={term._id} className="text-[13px]">
                {term.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {summaryReport?.term && (
          <div className="flex items-center gap-2 text-[13px] text-text-secondary">
            <span className="text-text-tertiary">|</span>
            <span>{format(summaryReport.term.startDate, 'MMM d, yyyy')}</span>
            <span>–</span>
            <span>{format(summaryReport.term.endDate, 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {selectedTermId ? (
        summaryReport ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border border-border-panel p-1">
              <TabsTrigger value="summary" className="text-[13px] data-[state=active]:bg-accent data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="text-[13px] data-[state=active]:bg-accent data-[state=active]:text-white">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Breakdown
              </TabsTrigger>
              <TabsTrigger value="outstanding" className="text-[13px] data-[state=active]:bg-accent data-[state=active]:text-white">
                <AlertCircle className="h-4 w-4 mr-2" />
                Outstanding
              </TabsTrigger>
              <TabsTrigger value="statements" className="text-[13px] data-[state=active]:bg-accent data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Statements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <FinancialSummary report={summaryReport} />
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <BreakdownReports report={summaryReport} />
            </TabsContent>

            <TabsContent value="outstanding" className="space-y-6">
              <OutstandingBalances report={outstandingReport || []} />
            </TabsContent>

            <TabsContent value="statements" className="space-y-6">
              <StudentStatements termId={selectedTermId as Id<'terms'>} />
            </TabsContent>
          </Tabs>
        ) : (
          <Skeleton className="h-96" />
        )
      ) : (
        <div className="py-16 text-center bg-white border border-border-panel rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-[14px] text-text-secondary">Select a term to view reports</p>
        </div>
      )}
    </div>
  );
}

function FinancialSummary({ report }: { report: any }) {
  const summary = report.invoiceSummary;
  const collectionRate = summary.invoicedZMW > 0 
    ? Math.round((summary.collectedZMW / summary.invoicedZMW) * 10000) / 100 
    : 0;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Invoiced"
          value={summary.invoicedZMW}
          icon={FileText}
          color="primary"
        />
        <SummaryCard
          title="Total Collected"
          value={summary.collectedZMW}
          icon={TrendingUp}
          color="success"
        />
        <SummaryCard
          title="Outstanding"
          value={summary.outstandingZMW}
          icon={AlertCircle}
          color={summary.outstandingZMW > 0 ? 'error' : 'success'}
        />
        <SummaryCard
          title="Collection Rate"
          value={`${collectionRate}%`}
          icon={CreditCard}
          color="accent"
          isPercentage
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Invoice Overview" description="Summary of all invoices">
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border-inner">
              <span className="text-[13px] text-text-secondary">Total Invoices</span>
              <span className="text-[15px] font-semibold">{summary.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-inner">
              <span className="text-[13px] text-text-secondary">Invoiced Amount</span>
              <span className="text-[15px] font-semibold">{formatZMW(summary.invoicedZMW)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-inner">
              <span className="text-[13px] text-text-secondary">Collected Amount</span>
              <span className="text-[15px] font-semibold text-success">{formatZMW(summary.collectedZMW)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[13px] text-text-secondary">Outstanding Balance</span>
              <span className={`text-[15px] font-semibold ${summary.outstandingZMW > 0 ? 'text-error' : 'text-success'}`}>
                {formatZMW(summary.outstandingZMW)}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Arrears" description="Overdue payments">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-text-secondary">Overdue Invoices</p>
                <p className="text-[24px] font-semibold text-error">{report.arrears.count}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-error/30" />
            </div>
            <div className="pt-4 border-t border-border-inner">
              <p className="text-[12px] text-text-secondary mb-1">Total Arrears Amount</p>
              <p className="text-[18px] font-semibold text-error">{formatZMW(report.arrears.totalZMW)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Credit Notes" description="Adjustments and refunds">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-text-secondary">Credit Notes Issued</p>
                <p className="text-[24px] font-semibold text-warning">{report.creditNotes.count}</p>
              </div>
              <CreditCard className="h-10 w-10 text-warning/30" />
            </div>
            <div className="pt-4 border-t border-border-inner">
              <p className="text-[12px] text-text-secondary mb-1">Total Credit Amount</p>
              <p className="text-[18px] font-semibold text-warning">{formatZMW(report.creditNotes.totalZMW)}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  isPercentage = false 
}: { 
  title: string; 
  value: number | string; 
  icon: any; 
  color: 'primary' | 'success' | 'error' | 'accent' | 'warning';
  isPercentage?: boolean;
}) {
  const colorClasses = {
    primary: 'bg-surface-subtle text-text-primary',
    success: 'bg-success-bg text-success',
    error: 'bg-error-bg text-error',
    accent: 'bg-accent-bg text-accent',
    warning: 'bg-warning-bg text-warning',
  };

  const displayValue = typeof value === 'number' && !isPercentage ? formatZMW(value) : value;

  return (
    <div className="p-4 bg-white border border-border-panel rounded-lg">
      <div className="flex items-center gap-2 text-text-secondary mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-[12px]">{title}</span>
      </div>
      <p className={`text-[22px] font-semibold ${colorClasses[color].split(' ')[1]}`}>
        {displayValue}
      </p>
    </div>
  );
}

function BreakdownReports({ report }: { report: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* By Fee Type */}
      <SectionCard title="Revenue by Fee Type" description="Collections breakdown by fee category">
        {report.byFeeType.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Fee Type</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Invoiced</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Collected</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {report.byFeeType.map((item: any) => (
                  <TableRow key={item.feeTypeId} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{item.feeTypeName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] tabular-nums">{formatZMW(item.invoicedZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-success tabular-nums">{formatZMW(item.collectedZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className={`text-[13px] tabular-nums ${item.outstandingZMW > 0 ? 'text-error' : 'text-text-secondary'}`}>
                        {formatZMW(item.outstandingZMW)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty>
              <EmptyTitle>No fee type data</EmptyTitle>
              <EmptyDescription>No invoices found for this term</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>

      {/* By Grade */}
      <SectionCard title="Collection by Grade" description="Performance per grade level">
        {report.byGrade.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Grade</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Students</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Collected</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {report.byGrade.map((item: any) => (
                  <TableRow key={item.gradeId} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-medium text-text-primary">{item.gradeName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-text-secondary">{item.studentCount}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-success tabular-nums">{formatZMW(item.collectedZMW)}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[11px]",
                          item.collectionRate >= 80 ? "bg-success-bg text-success border-success-border" :
                          item.collectionRate >= 50 ? "bg-warning-bg text-warning border-warning-border" :
                          "bg-error-bg text-error border-error-border"
                        )}
                      >
                        {item.collectionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty>
              <EmptyTitle>No grade data</EmptyTitle>
              <EmptyDescription>No student invoices found for this term</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>

      {/* Payment Methods */}
      <SectionCard title="Payment Methods" description="Collections by payment channel" className="lg:col-span-2">
        {report.paymentMethods.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Method</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Transactions</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Total Amount</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {(() => {
                  const totalAmount = report.paymentMethods.reduce((sum: number, m: any) => sum + m.totalZMW, 0);
                  return report.paymentMethods.map((item: any) => {
                    const percent = totalAmount > 0 ? (item.totalZMW / totalAmount) * 100 : 0;
                    return (
                      <TableRow key={item.method} className="hover:bg-surface-subtle transition-colors">
                        <TableCell className="px-4 py-3">
                          <p className="text-[13px] font-medium text-text-primary capitalize">
                            {item.method.replace(/_/g, ' ')}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] text-text-secondary">{item.count}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <p className="text-[13px] font-medium tabular-nums">{formatZMW(item.totalZMW)}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Badge variant="outline" className="text-[11px]">
                            {percent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty>
              <EmptyTitle>No payment data</EmptyTitle>
              <EmptyDescription>No confirmed payments for this term</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function OutstandingBalances({ report }: { report: any[] }) {
  return (
    <SectionCard title="Outstanding Balances Report" description="Students with unpaid fees">
      {report.length > 0 ? (
        <div className="border border-border-panel rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-surface-subtle">
              <TableRow className="border-b border-border-inner hover:bg-transparent">
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Rank</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student #</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Grade</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-center">Invoices</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Balance</TableHead>
                <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">% of Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border-row bg-white">
              {report.map((item, index) => (
                <TableRow key={item.studentId} className="hover:bg-surface-subtle transition-colors">
                  <TableCell className="px-4 py-3">
                    <span className="text-[12px] text-text-tertiary font-medium">#{index + 1}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="text-[13px] font-medium text-text-primary">{item.studentName}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="text-[13px] text-text-secondary font-mono">{item.studentNumber}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="text-[13px] text-text-secondary">{item.gradeName}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[11px]">{item.invoiceCount}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <p className="text-[13px] font-semibold text-error tabular-nums">{formatZMW(item.outstandingZMW)}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[11px]",
                        item.percentOfGradeTotal > 20 ? "bg-error-bg text-error border-error-border" :
                        item.percentOfGradeTotal > 10 ? "bg-warning-bg text-warning border-warning-border" :
                        "bg-surface-subtle text-text-secondary"
                      )}
                    >
                      {item.percentOfGradeTotal.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-12">
          <Empty>
            <EmptyTitle>No outstanding balances</EmptyTitle>
            <EmptyDescription>All students are up to date with their payments</EmptyDescription>
          </Empty>
        </div>
      )}
    </SectionCard>
  );
}

function StudentStatements({ termId }: { termId: Id<'terms'> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openSearch, setOpenSearch] = useState(false);
  const [showStatement, setShowStatement] = useState(false);

  const students = useQuery(
    api.students.queries.searchStudents,
    searchQuery.length >= 2 ? { query: searchQuery, limit: 10 } : 'skip'
  );

  const statement = useQuery(
    api.fees.reports.generateStudentFeesStatement,
    selectedStudent?._id ? { studentId: selectedStudent._id, termId } : 'skip'
  );

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setOpenSearch(false);
    setSearchQuery('');
  };

  const handleViewStatement = () => {
    setShowStatement(true);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Generate Student Statement" description="View complete fee history for a student">
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[280px]">
              <label className="text-[12px] text-text-secondary mb-2 block">Search Student</label>
              <Popover open={openSearch} onOpenChange={setOpenSearch}>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSearch}
                    className="w-full justify-between text-[13px] h-10"
                  >
                    {selectedStudent ? (
                      <span>
                        {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.studentNumber})
                      </span>
                    ) : (
                      <span className="text-text-tertiary">Search by name or student number...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Type to search students..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      className="text-[13px]"
                    />
                    <CommandList>
                      <CommandEmpty className="text-[13px] p-4">
                        {searchQuery.length < 2 
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

            <Button
              onClick={handleViewStatement}
              disabled={!selectedStudent || !statement}
              className="bg-accent hover:bg-accent-hover gap-2"
            >
              <FileText className="h-4 w-4" />
              View Statement
            </Button>
          </div>

          {selectedStudent && !statement && (
            <div className="py-8 text-center">
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Statement Dialog */}
      <Dialog open={showStatement} onOpenChange={setShowStatement}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {statement && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[18px]">Student Fee Statement</DialogTitle>
                <DialogDescription className="text-[13px]">
                  Generated on {format(statement.generatedAt, 'MMM d, yyyy HH:mm')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Header Info */}
                <div className="border-b border-border-inner pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[16px] font-semibold text-text-primary">
                        {statement.school.name}
                      </h3>
                      {statement.school.logoUrl && (
                        <img 
                          src={statement.school.logoUrl} 
                          alt="School Logo" 
                          className="h-12 mt-2 object-contain"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] text-text-secondary">Statement #</p>
                      <p className="text-[13px] font-mono">{statement.student.studentNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Student & Guardian Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-subtle rounded-lg">
                    <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Student</p>
                    <p className="text-[14px] font-medium text-text-primary">
                      {statement.student.firstName} {statement.student.lastName}
                    </p>
                    <p className="text-[12px] text-text-secondary">{statement.student.studentNumber}</p>
                  </div>
                  {statement.guardian && (
                    <div className="p-3 bg-surface-subtle rounded-lg">
                      <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">Guardian</p>
                      <p className="text-[14px] font-medium text-text-primary">
                        {statement.guardian.firstName} {statement.guardian.lastName}
                      </p>
                      <p className="text-[12px] text-text-secondary">{statement.guardian.phone}</p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-accent-bg rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[11px] text-accent-text mb-1">Total Invoiced</p>
                      <p className="text-[16px] font-semibold text-text-primary">
                        {formatZMW(statement.summary.totalInvoicedZMW)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-accent-text mb-1">Total Paid</p>
                      <p className="text-[16px] font-semibold text-success">
                        {formatZMW(statement.summary.totalPaidZMW)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-accent-text mb-1">Outstanding</p>
                      <p className={`text-[16px] font-semibold ${statement.summary.outstandingZMW > 0 ? 'text-error' : 'text-success'}`}>
                        {formatZMW(statement.summary.outstandingZMW)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoices */}
                {statement.invoices.length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-medium text-text-primary mb-3">Invoices</h4>
                    <div className="border border-border-panel rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-surface-subtle">
                          <TableRow>
                            <TableHead className="text-[11px] px-3 py-2">Invoice #</TableHead>
                            <TableHead className="text-[11px] px-3 py-2">Due Date</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Total</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Paid</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Balance</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.invoices.map((inv: any) => (
                            <TableRow key={inv.invoiceNumber}>
                              <TableCell className="text-[12px] font-mono px-3 py-2">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-[12px] px-3 py-2">
                                {format(inv.dueDate, 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-[12px] text-right px-3 py-2">{formatZMW(inv.totalZMW)}</TableCell>
                              <TableCell className="text-[12px] text-success text-right px-3 py-2">{formatZMW(inv.paidZMW)}</TableCell>
                              <TableCell className={`text-[12px] text-right px-3 py-2 ${inv.balanceZMW > 0 ? 'text-error' : 'text-text-secondary'}`}>
                                {formatZMW(inv.balanceZMW)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-center">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px]",
                                    inv.status === 'paid' ? "bg-success-bg text-success border-success-border" :
                                    inv.status === 'partial' ? "bg-warning-bg text-warning border-warning-border" :
                                    inv.status === 'overdue' ? "bg-error-bg text-error border-error-border" :
                                    "bg-surface-subtle text-text-secondary"
                                  )}
                                >
                                  {inv.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Payments */}
                {statement.payments.length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-medium text-text-primary mb-3">Payment History</h4>
                    <div className="border border-border-panel rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-surface-subtle">
                          <TableRow>
                            <TableHead className="text-[11px] px-3 py-2">Receipt #</TableHead>
                            <TableHead className="text-[11px] px-3 py-2">Date</TableHead>
                            <TableHead className="text-[11px] px-3 py-2">Method</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.payments.map((pmt: any) => (
                            <TableRow key={pmt.receiptNumber}>
                              <TableCell className="text-[12px] font-mono px-3 py-2">{pmt.receiptNumber}</TableCell>
                              <TableCell className="text-[12px] px-3 py-2">
                                {format(pmt.createdAt, 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-[12px] capitalize px-3 py-2">
                                {pmt.method.replace(/_/g, ' ')}
                              </TableCell>
                              <TableCell className="text-[12px] font-medium text-right px-3 py-2">
                                {formatZMW(pmt.amountZMW)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Ledger */}
                {statement.ledger.length > 0 && (
                  <div>
                    <h4 className="text-[13px] font-medium text-text-primary mb-3">Account Ledger</h4>
                    <div className="border border-border-panel rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-surface-subtle">
                          <TableRow>
                            <TableHead className="text-[11px] px-3 py-2">Date</TableHead>
                            <TableHead className="text-[11px] px-3 py-2">Description</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Debit</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Credit</TableHead>
                            <TableHead className="text-[11px] px-3 py-2 text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.ledger.map((entry: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="text-[12px] px-3 py-2">
                                {format(entry.date, 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-[12px] px-3 py-2">{entry.description}</TableCell>
                              <TableCell className="text-[12px] text-error text-right px-3 py-2">
                                {entry.debitZMW > 0 ? formatZMW(entry.debitZMW) : '-'}
                              </TableCell>
                              <TableCell className="text-[12px] text-success text-right px-3 py-2">
                                {entry.creditZMW > 0 ? formatZMW(entry.creditZMW) : '-'}
                              </TableCell>
                              <TableCell className="text-[12px] font-medium text-right px-3 py-2">
                                {formatZMW(entry.balanceAfterZMW)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-inner">
                  <Button variant="outline" onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button className="bg-accent hover:bg-accent-hover gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-16" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
