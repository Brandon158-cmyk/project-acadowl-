'use client';

import { useQuery } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { MetricCard } from '@/components/shared/MetricCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import {
  Receipt,
  Banknote,
  AlertTriangle,
  FileText,
  Landmark,
  Smartphone,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { formatZMW } from '@/lib/utils/formatZMW';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { api } from '../../../../../convex/_generated/api';

// Collection rate color coding
function getCollectionRateColor(rate: number): string {
  if (rate < 50) return '#BE123C'; // error red
  if (rate < 80) return '#B45309'; // warning amber
  return '#15803D'; // success green
}

// Status badge helpers
function getInvoiceStatusBadge(status: string) {
  const styles: Record<string, string> = {
    paid: 'bg-success-bg text-success border-success-border',
    partial: 'bg-warning-bg text-warning border-warning-border',
    sent: 'bg-info-bg text-info border-info-border',
    overdue: 'bg-error-bg text-error border-error-border',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    void: 'bg-gray-100 text-gray-400 border-gray-200 line-through',
  };
  return styles[status] || styles.draft;
}

export default function FinanceDashboardPage() {
  const stats = useQuery(api.fees.dashboardStats.getFinanceDashboardStats, {});

  if (stats === undefined) {
    return <DashboardSkeleton />;
  }

  const collectionRateColor = getCollectionRateColor(stats.collectionRate);

  // Payment method data for pie chart
  const paymentMethodData = Object.entries(stats.paymentMethodBreakdown || {})
    .filter(([, value]) => value > 0)
    .map(([method, value]) => ({
      name: method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));

  const COLORS = ['#3730A3', '#15803D', '#B45309', '#6B6B6B'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        description="Real-time overview of school fees and collections"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Link href="/fees/payments/record">
                <Banknote className="h-4 w-4" />
                Record Payment
              </Link>
            </Button>
            <Button className="gap-2 bg-accent hover:bg-accent-hover">
              <Link href="/fees/invoices">
                <Plus className="h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Invoiced"
          value={formatZMW(stats.totalInvoicedZMW)}
          icon={Receipt}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          label="Total Collected"
          value={formatZMW(stats.totalCollectedZMW)}
          icon={Banknote}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          label="Outstanding"
          value={formatZMW(stats.totalOutstandingZMW)}
          icon={AlertTriangle}
          trend={{ value: 5, isPositive: false }}
        />
        <Card className="border-border-panel">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-secondary">
                  Collection Rate
                </p>
                <p className="mt-1 text-[26px] font-semibold text-text-primary">
                  {stats.collectionRate.toFixed(1)}%
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${collectionRateColor}15` }}
              >
                <TrendingUp
                  className="h-6 w-6"
                  style={{ color: collectionRateColor }}
                />
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-surface-hover overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(stats.collectionRate, 100)}%`,
                  backgroundColor: collectionRateColor,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Summary & Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Summary */}
        <SectionCard
          title="Invoice Summary"
          description="Current term invoice status breakdown"
          action={
            <Button variant="ghost" size="sm" className="gap-1">
              <Link href="/fees/invoices">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-4 p-5">
            <div className="space-y-1">
              <p className="text-[12px] text-text-secondary">Paid</p>
              <p className="text-[20px] font-semibold text-success">{stats.paidCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-text-secondary">Partial</p>
              <p className="text-[20px] font-semibold text-warning">{stats.partialCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-text-secondary">Overdue</p>
              <p className="text-[20px] font-semibold text-error">{stats.overdueCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-text-secondary">Total</p>
              <p className="text-[20px] font-semibold text-text-primary">{stats.invoiceCount}</p>
            </div>
          </div>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard
          title="Payment Methods"
          description="Collections by payment channel"
          className="lg:col-span-2"
        >
          <div className="p-5">
            {paymentMethodData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatZMW(value)}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #D0CBC4',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty>
                <EmptyTitle>No payment data</EmptyTitle>
                <EmptyDescription>Payments will appear here once recorded</EmptyDescription>
              </Empty>
            )}
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              {paymentMethodData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-[13px] text-text-secondary">
                    {entry.name}: {formatZMW(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Payments & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Payments */}
        <SectionCard
          title="Recent Payments"
          description="Latest payment activity"
          className="lg:col-span-2"
        >
          <div className="divide-y divide-border-row">
            {stats.recentPayments && stats.recentPayments.length > 0 ? (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-subtle transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle">
                      {payment.method === 'cash' ? (
                        <Banknote className="h-4 w-4 text-text-secondary" />
                      ) : payment.method === 'bank_transfer' ? (
                        <Landmark className="h-4 w-4 text-text-secondary" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-text-primary">
                        {payment.studentName}
                      </p>
                      <p className="text-[12px] text-text-secondary">
                        {payment.receiptNumber} •{' '}
                        {new Date(payment.createdAt).toLocaleDateString('en-ZM')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium text-text-primary">
                      {formatZMW(payment.amountZMW)}
                    </p>
                    <p className="text-[11px] text-text-secondary capitalize">
                      {payment.method.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8">
                <Empty>
                  <EmptyTitle>No recent payments</EmptyTitle>
                  <EmptyDescription>Payments will appear here once recorded</EmptyDescription>
                </Empty>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" description="Common finance tasks">
          <div className="grid gap-2 p-5">
            <Button variant="outline" className="justify-start gap-3 h-auto py-3">
              <Link href="/fees/structure">
                <Receipt className="h-4 w-4 text-accent" />
                <div className="text-left">
                  <p className="text-[13px] font-medium">Fee Structure</p>
                  <p className="text-[11px] text-text-secondary">Configure term fees</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3">
              <Link href="/fees/arrears">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div className="text-left">
                  <p className="text-[13px] font-medium">Arrears</p>
                  <p className="text-[11px] text-text-secondary">
                    {stats.overdueCount} overdue invoices
                  </p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3">
              <Link href="/fees/cashbook">
                <FileText className="h-4 w-4 text-text-secondary" />
                <div className="text-left">
                  <p className="text-[13px] font-medium">Daily Cashbook</p>
                  <p className="text-[11px] text-text-secondary">View today&apos;s entries</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3">
              <Link href="/fees/analytics">
                <TrendingUp className="h-4 w-4 text-success" />
                <div className="text-left">
                  <p className="text-[13px] font-medium">Analytics</p>
                  <p className="text-[11px] text-text-secondary">Collection trends</p>
                </div>
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-1" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}
