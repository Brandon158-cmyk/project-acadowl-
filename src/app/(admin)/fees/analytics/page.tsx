'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, BarChart3, PieChart, AlertTriangle } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { api } from '../../../../../convex/_generated/api';

const COLORS = ['#3730A3', '#15803D', '#B45309', '#6B6B6B', '#BE123C', '#0369A1'];

export default function AnalyticsPage() {
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  
  const terms = useQuery(api.terms.getActiveTerms);
  const analytics = useQuery(
    api.fees.analytics.getCollectionAnalytics,
    selectedTermId ? { termId: selectedTermId as any } : 'skip'
  );
  const methodTrends = useQuery(
    api.fees.analytics.getPaymentMethodTrends,
    selectedTermId ? { termId: selectedTermId as any } : 'skip'
  );
  const outstandingReport = useQuery(
    api.fees.reports.getOutstandingBalancesReport,
    selectedTermId ? { termId: selectedTermId as any, limit: 20 } : 'skip'
  );

  // Prepare chart data
  const gradeData = analytics?.byGrade.map(g => ({
    name: g.gradeName,
    expected: g.expectedZMW,
    collected: g.collectedZMW,
    rate: g.collectionRate,
  })) || [];

  const methodData = Object.entries(methodTrends || {}).map(([method, amount]) => ({
    name: method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: amount,
  })).filter(d => d.value > 0);

  if (terms === undefined) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Analytics"
        description="Collection trends and financial insights"
      />

      <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
        <Select value={selectedTermId} onValueChange={(val) => setSelectedTermId(val ?? '')}>
          <SelectTrigger className="w-[200px] text-[13px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms?.map((term) => (
              <SelectItem key={term._id} value={term._id} className="text-[13px]">{term.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTermId ? (
        analytics ? (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-white border border-border-panel rounded-lg">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-[12px]">Expected Revenue</span>
                </div>
                <p className="text-[20px] font-semibold text-text-primary">{formatZMW(analytics.totalExpected ?? 0)}</p>
              </div>
              <div className="p-4 bg-white border border-border-panel rounded-lg">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[12px]">Collected</span>
                </div>
                <p className="text-[20px] font-semibold text-success">{formatZMW(analytics.totalCollected ?? 0)}</p>
              </div>
              <div className="p-4 bg-white border border-border-panel rounded-lg">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[12px]">Outstanding</span>
                </div>
                <p className="text-[20px] font-semibold text-error">{formatZMW(analytics.totalOutstanding ?? 0)}</p>
              </div>
              <div className="p-4 bg-white border border-border-panel rounded-lg">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <PieChart className="h-4 w-4" />
                  <span className="text-[12px]">Collection Rate</span>
                </div>
                <p className="text-[20px] font-semibold text-accent">{(analytics.collectionRate ?? 0).toFixed(1)}%</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Grade Collection Rates */}
              <SectionCard title="Collection by Grade" description="Expected vs collected per grade">
                <div className="p-5 h-[300px]">
                  {gradeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `K${(v/1000).toFixed(0)}`} />
                        <Tooltip 
                          formatter={(value: number) => formatZMW(value)}
                          contentStyle={{ fontSize: 12, border: '1px solid #D0CBC4', borderRadius: 6 }}
                        />
                        <Bar dataKey="expected" fill="#D0CBC4" name="Expected" />
                        <Bar dataKey="collected" fill="#3730A3" name="Collected" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty>
                      <EmptyTitle>No data</EmptyTitle>
                      <EmptyDescription>No grade data available for this term</EmptyDescription>
                    </Empty>
                  )}
                </div>
              </SectionCard>

              {/* Payment Methods */}
              <SectionCard title="Payment Methods" description="Collections by payment channel">
                <div className="p-5 h-[300px]">
                  {methodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={methodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {methodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatZMW(value)} contentStyle={{ fontSize: 12 }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty>
                      <EmptyTitle>No data</EmptyTitle>
                      <EmptyDescription>No payment data for this term</EmptyDescription>
                    </Empty>
                  )}
                </div>
                {/* Legend */}
                <div className="px-5 pb-5 flex flex-wrap gap-3 justify-center">
                  {methodData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[12px] text-text-secondary">{entry.name}: {formatZMW(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Top Outstanding Balances */}
            <SectionCard title="Top Outstanding Balances" description="Students with highest arrears">
              {outstandingReport && outstandingReport.length > 0 ? (
                <div className="border border-border-panel rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-surface-subtle">
                      <TableRow className="border-b border-border-inner hover:bg-transparent">
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Rank</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Student</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Grade</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Balance</TableHead>
                        <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">% of Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border-row bg-white">
                      {outstandingReport.map((item, index) => (
                        <TableRow key={item.studentId} className="hover:bg-surface-subtle transition-colors">
                          <TableCell className="px-4 py-3">
                            <span className="text-[12px] text-text-tertiary font-medium">#{index + 1}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-[13px] font-medium text-text-primary">{item.studentName}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-[13px] text-text-secondary">{item.gradeName}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <p className="text-[13px] font-semibold text-error tabular-nums">{formatZMW(item.outstandingZMW)}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <Badge variant="outline" className="text-[11px]">{item.percentOfGradeTotal.toFixed(1)}%</Badge>
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
                    <EmptyDescription>All students are up to date</EmptyDescription>
                  </Empty>
                </div>
              )}
            </SectionCard>
          </>
        ) : (
          <Skeleton className="h-96" />
        )
      ) : (
        <div className="py-12 text-center">
          <p className="text-[13px] text-text-secondary">Select a term to view analytics</p>
        </div>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-20" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}
