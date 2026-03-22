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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Printer, ScrollText, Banknote } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';

export default function CashbookPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isPrintMode, setIsPrintMode] = useState(false);

  const cashbook = useQuery(
    api.fees.cashbook.getDailyCashbookReport,
    { date: selectedDate.getTime() }
  );

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  if (cashbook === undefined) {
    return <CashbookSkeleton />;
  }

  return (
    <div className={`space-y-6 ${isPrintMode ? 'print:p-8' : ''}`}>
      <PageHeader
        title="Daily Cashbook"
        description="Record of all cash payments received"
        actions={
          !isPrintMode && (
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Cashbook
            </Button>
          )
        }
      />

      {!isPrintMode && (
        <div className="flex flex-wrap gap-4 p-4 bg-white border border-border-panel rounded-lg">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Cashbook Summary */}
      <div className={`grid gap-4 ${isPrintMode ? '' : 'md:grid-cols-3'}`}>
        <div className="p-4 bg-white border border-border-panel rounded-lg print:border-black">
          <p className="text-[12px] text-text-secondary print:text-black">Total Cash Received</p>
          <p className="text-[24px] font-semibold text-text-primary print:text-black">
            {formatZMW(cashbook.totalCash)}
          </p>
        </div>
        <div className="p-4 bg-white border border-border-panel rounded-lg print:border-black">
          <p className="text-[12px] text-text-secondary print:text-black">Number of Transactions</p>
          <p className="text-[24px] font-semibold text-text-primary print:text-black">
            {cashbook.entryCount}
          </p>
        </div>
        <div className="p-4 bg-white border border-border-panel rounded-lg print:border-black">
          <p className="text-[12px] text-text-secondary print:text-black">Date</p>
          <p className="text-[20px] font-semibold text-text-primary print:text-black">
            {format(selectedDate, 'PPP')}
          </p>
        </div>
      </div>

      {/* Cashbook Entries */}
      <SectionCard
        title="Cashbook Entries"
        description={`${cashbook.entries.length} cash transactions`}
      >
        {cashbook.entries.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden print:border-black">
            <Table>
              <TableHeader className="bg-surface-subtle print:bg-gray-100">
                <TableRow className="border-b border-border-inner hover:bg-transparent print:border-black">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 print:text-black">Time</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 print:text-black">Receipt #</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 print:text-black">Student</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 print:text-black">Invoice</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right print:text-black">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white print:divide-black">
                {cashbook.entries.map((entry: any) => (
                  <TableRow key={entry.paymentId} className="hover:bg-surface-subtle transition-colors print:hover:bg-white">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-primary print:text-black">
                        {format(new Date(entry.createdAt), 'h:mm a')}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-mono text-[13px] text-text-primary print:text-black">{entry.receiptNumber}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-primary print:text-black">{entry.studentName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-mono text-[12px] text-text-secondary print:text-black">{entry.invoiceNumber}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] font-medium text-text-primary tabular-nums print:text-black">
                        {formatZMW(entry.amountZMW)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-surface-subtle print:bg-gray-100 font-semibold">
                  <TableCell colSpan={4} className="px-4 py-3 text-right">
                    <p className="text-[13px] text-text-primary print:text-black">Total Cash Received</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <p className="text-[15px] font-semibold text-text-primary tabular-nums print:text-black">
                      {formatZMW(cashbook.totalCash)}
                    </p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12">
            <Empty
              title="No cash entries"
              description={`No cash payments recorded for ${format(selectedDate, 'PPP')}`}
              icon={Banknote}
            />
          </div>
        )}
      </SectionCard>

      {/* Signature Section - Print Only */}
      {isPrintMode && (
        <div className="mt-12 pt-8 border-t border-black">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[13px] font-medium text-black mb-8">Bursar Signature</p>
              <div className="border-b border-black pb-2">
                <p className="text-[12px] text-gray-600">Signature & Date</p>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-black mb-8">Senior Management</p>
              <div className="border-b border-black pb-2">
                <p className="text-[12px] text-gray-600">Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CashbookSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-28" /></div>
      <div className="grid md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
