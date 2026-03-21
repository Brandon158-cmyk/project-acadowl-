'use client';

import { useState, useRef, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Upload, FileUp, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ParsedRow {
  firstName: string;
  lastName: string;
  dateOfBirth?: number;
  gender: 'male' | 'female' | 'other';
  guardianFirstName: string;
  guardianLastName: string;
  guardianPhone: string;
}

export function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [gradeId, setGradeId] = useState<Id<'grades'> | ''>('');
  const [sectionId, setSectionId] = useState<Id<'sections'> | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formData = useQuery(api.students.queries.getEnrollmentFormData);
  const bulkImport = useMutation(api.students.mutations.bulkImportStudents);

  const sectionOptions = useMemo(() => {
    if (!formData) return [];
    if (!gradeId) return formData.sections;
    return formData.sections.filter((section) => section.gradeId === gradeId);
  }, [formData, gradeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      if (lines.length < 2) {
        toast.error('CSV file is empty or missing headers');
        setIsParsing(false);
        return;
      }

      // Extract headers
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      
      const requiredHeaders = ['firstname', 'lastname', 'gender', 'guardianfirstname', 'guardianlastname', 'guardianphone'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        setIsParsing(false);
        return;
      }

      const rows: ParsedRow[] = [];
      let parseError = null;

      for (let i = 1; i < lines.length; i++) {
        const rowData = lines[i].split(',').map((cell) => cell.trim());
        if (rowData.length < requiredHeaders.length) continue;

        const getValue = (key: string) => rowData[headers.indexOf(key)];

        const genderVal = getValue('gender').toLowerCase();
        let gender: 'male' | 'female' | 'other' = 'other';
        if (genderVal === 'male' || genderVal === 'm') gender = 'male';
        if (genderVal === 'female' || genderVal === 'f') gender = 'female';

        let dateOfBirth: number | undefined;
        const dobStr = headers.includes('dateofbirth') ? getValue('dateofbirth') : undefined;
        if (dobStr) {
          const parsedDate = new Date(dobStr).getTime();
          if (!isNaN(parsedDate)) dateOfBirth = parsedDate;
        }

        try {
          rows.push({
            firstName: getValue('firstname'),
            lastName: getValue('lastname'),
            gender,
            dateOfBirth,
            guardianFirstName: getValue('guardianfirstname'),
            guardianLastName: getValue('guardianlastname'),
            guardianPhone: getValue('guardianphone'),
          });
        } catch {
          parseError = `Error parsing row ${i + 1}`;
          break;
        }
      }

      if (parseError) {
        toast.error(parseError);
      } else {
        setParsedData(rows);
      }
      setIsParsing(false);
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!gradeId || !sectionId) {
      toast.error('Please select a grade and section before importing.');
      return;
    }

    if (parsedData.length === 0) {
      toast.error('No valid data to import.');
      return;
    }

    setIsImporting(true);
    try {
      const payload = parsedData.map(row => ({
        ...row,
        gradeId: gradeId as Id<'grades'>,
        sectionId: sectionId as Id<'sections'>,
      }));

      const result = await bulkImport({ students: payload });

      if (result.errorCount > 0) {
        toast.error(`Imported ${result.successCount} students. ${result.errorCount} failed.`);
        console.error('Import errors:', result.errors);
      } else {
        toast.success(`Successfully imported ${result.successCount} students.`);
        handleOpenChange(false);
      }
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setGradeId('');
      setSectionId('');
      clearFile();
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95"
      >
        <FileUp className="h-4 w-4" />
        Bulk Import
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white text-gray-900 border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-semibold text-onyx">Bulk Import Students</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 border-y border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Target Grade <span className="text-red-500">*</span></span>
              <select
                value={gradeId}
                onChange={(e) => {
                  setGradeId(e.target.value as Id<'grades'>);
                  setSectionId('');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20"
              >
                <option value="" disabled>Select a grade</option>
                {formData?.grades.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Target Section <span className="text-red-500">*</span></span>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value as Id<'sections'>)}
                disabled={!gradeId}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20 disabled:bg-gray-100 disabled:opacity-50"
              >
                <option value="" disabled>Select a section</option>
                {sectionOptions.map((s) => (
                  <option key={s._id} value={s._id}>{s.displayName ?? s.name}</option>
                ))}
              </select>
            </label>
          </div>

          {!file ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors hover:border-school-primary/50 hover:bg-school-primary/5">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">Upload CSV File</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Required columns: firstName, lastName, gender, guardianFirstName, guardianLastName, guardianPhone. Optional: dateOfBirth (YYYY-MM-DD).</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                {isParsing ? 'Parsing...' : 'Select File'}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-school-primary" />
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">{parsedData.length} rows</span>
                </div>
                <button onClick={clearFile} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-0">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-2">Student Name</th>
                      <th className="px-4 py-2">Gender</th>
                      <th className="px-4 py-2">Guardian</th>
                      <th className="px-4 py-2">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{row.firstName} {row.lastName}</td>
                        <td className="px-4 py-2 text-gray-600 capitalize">{row.gender}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">{row.guardianFirstName} {row.guardianLastName}</td>
                        <td className="px-4 py-2 text-gray-600">{row.guardianPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="bg-gray-50 border-t border-gray-100 p-2 text-center text-xs text-gray-500 font-medium">
                    + {parsedData.length - 5} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {parsedData.length > 0 && gradeId && sectionId && (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success-foreground flex items-start gap-2 border border-success/20">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Ready to import <strong>{parsedData.length}</strong> students into the selected grade and section.</p>
            </div>
          )}
          
          {parsedData.length > 0 && (!gradeId || !sectionId) && (
            <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-800 flex items-start gap-2 border border-amber-200">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Please select a Target Grade and Section to proceed.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting} className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!gradeId || !sectionId || parsedData.length === 0 || isImporting}
            className="bg-school-primary text-white hover:bg-crimson-dark"
          >
            {isImporting ? 'Importing...' : 'Start Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
