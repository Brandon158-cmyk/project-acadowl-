'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload, Landmark, Download } from 'lucide-react';
import { formatZMW } from '@/lib/utils/formatZMW';
import { format } from 'date-fns';
import { api } from '../../../../../convex/_generated/api';

const BANK_FORMATS = [
  { value: 'zanaco_csv', label: 'ZANACO Bank (CSV)' },
  { value: 'standard_chartered_csv', label: 'Standard Chartered (CSV)' },
  { value: 'absa_csv', label: 'Absa Bank (CSV)' },
  { value: 'fnb_csv', label: 'FNB Zambia (CSV)' },
  { value: 'stanbic_csv', label: 'Stanbic Bank (CSV)' },
  { value: 'generic_csv', label: 'Generic CSV (Date, Description, Amount)' },
];

export default function BankReconciliationPage() {
  const [selectedFormat, setSelectedFormat] = useState('generic_csv');
  const [isUploading, setIsUploading] = useState(false);
  const [confirmImport, setConfirmImport] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState('');

  const imports = useQuery(api.fees.bankReconciliation.getBankStatementImports);
  const importBankStatement = useMutation(api.fees.bankReconciliation.importBankStatement);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setConfirmImport({ fileName: file.name, format: selectedFormat });
    };
    reader.readAsText(file);
  }, [selectedFormat]);

  const handleImport = async () => {
    if (!fileContent) return;
    setIsUploading(true);
    try {
      await importBankStatement({
        csvContent: fileContent,
        bankFormat: selectedFormat as any,
      });
      setConfirmImport(null);
      setFileContent('');
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  if (imports === undefined) {
    return <BankReconciliationSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Import and reconcile bank statement transactions"
      />

      {/* Upload Section */}
      <SectionCard
        title="Import Bank Statement"
        description="Upload CSV file from your bank to automatically match transactions"
      >
        <div className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as string)}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select bank format" />
              </SelectTrigger>
              <SelectContent>
                {BANK_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value} className="text-[13px]">
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full gap-2">
                <Upload className="h-4 w-4" />
                {fileName || 'Select CSV File'}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-surface-subtle rounded-lg">
            <p className="text-[12px] text-text-secondary">
              <strong>Supported formats:</strong> CSV files with columns for Date, Description/Reference, and Amount. 
              The system will attempt to match transactions to invoices by reference number or student name.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Import History */}
      <SectionCard
        title="Import History"
        description={`${imports.length} bank statement imports`}
      >
        {imports.length > 0 ? (
          <div className="border border-border-panel rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-subtle">
                <TableRow className="border-b border-border-inner hover:bg-transparent">
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Date</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">File Name</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3">Bank</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Transactions</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Auto-Matched</TableHead>
                  <TableHead className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-4 py-3 text-right">Unmatched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-row bg-white">
                {imports.map((importItem: any) => (
                  <TableRow key={importItem._id} className="hover:bg-surface-subtle transition-colors">
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-text-primary">
                        {format(new Date(importItem.importedAt), 'MMM d, yyyy')}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] font-mono text-text-primary">{importItem.fileName}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-[11px] capitalize">
                        {importItem.bankFormat.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-text-primary">{importItem.transactionCount}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-success">{importItem.autoMatchedCount}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className={`text-[13px] ${importItem.unmatchedCount > 0 ? 'text-warning' : 'text-text-secondary'}`}>
                        {importItem.unmatchedCount}
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
              <EmptyTitle>No imports yet</EmptyTitle>
              <EmptyDescription>Upload your first bank statement to get started</EmptyDescription>
            </Empty>
          </div>
        )}
      </SectionCard>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={!!confirmImport} onOpenChange={() => setConfirmImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Bank Statement</AlertDialogTitle>
            <AlertDialogDescription>
              Import {confirmImport?.fileName} ({confirmImport?.format.replace(/_/g, ' ')})?
              <br /><br />
              The system will attempt to:
              <ul className="list-disc list-inside mt-2 text-[13px]">
                <li>Parse transaction dates and amounts</li>
                <li>Match transactions to invoices by reference</li>
                <li>Record payments for matched transactions</li>
                <li>Flag unmatched transactions for manual review</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmImport(null); setFileContent(''); setFileName(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={isUploading}
              className="bg-accent hover:bg-accent-hover"
            >
              {isUploading ? 'Importing...' : 'Import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BankReconciliationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-96" />
    </div>
  );
}
