'use client';

import { useQuery } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ChevronLeft } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ReportCardPage() {
  const params = useParams<{ studentId: string; sessionId: string }>();
  const router = useRouter();

  const data = useQuery(api.schools.examQueries.getStudentReportCard, {
    studentId: params.studentId as Id<'students'>,
    examSessionId: params.sessionId as Id<'examSessions'>,
  });

  if (data === undefined) {
    return <PageSkeleton />;
  }

  if (data === null) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Report Card Not Found</h2>
          <p className="mt-2 text-gray-600">This report card does not exist or you don't have permission to view it.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-lg bg-school-primary px-4 py-2 font-medium text-white shadow hover:bg-crimson-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { student, grade, section, session, term, school, config, results, attendanceSummary, overall } = data;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:bg-white print:p-0">
      {/* Non-printable controls */}
      <div className="mx-auto mb-6 max-w-4xl print:hidden flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-crimson-dark"
        >
          <Printer className="h-4 w-4" />
          Print Report Card
        </button>
      </div>

      {/* Printable Area */}
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none print:p-0">
        
        {/* Header */}
        <div className="border-b-4 border-school-primary pb-6 text-center">
          {school.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="School Logo" className="mx-auto h-20 w-auto object-contain" />
          )}
          <h1 className="mt-4 text-3xl font-bold text-gray-900 uppercase tracking-widest">{school.name ?? 'ACADEMIC REPORT'}</h1>
          <p className="mt-1 text-sm italic text-gray-600">{school.motto}</p>
          <div className="mt-4 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-800">
            {term?.name ?? 'Term'} • {session.name}
          </div>
        </div>

        {/* Student Information */}
        <div className="mt-8 grid grid-cols-2 gap-6 rounded-xl border border-gray-200 bg-gray-50 p-6 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student Name</p>
            <p className="mt-1 font-medium text-gray-900">{student.firstName} {student.lastName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Student ID</p>
            <p className="mt-1 font-medium text-gray-900">{student.studentNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Class</p>
            <p className="mt-1 font-medium text-gray-900">{grade?.name} {section ? `- ${section.displayName ?? section.name}` : ''}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Term</p>
            <p className="mt-1 font-medium text-gray-900">{term?.name ?? 'N/A'}</p>
          </div>
        </div>

        {/* Results Table */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">Academic Performance</h2>
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold text-center">Marks Obtained</th>
                <th className="px-4 py-3 font-semibold text-center">Max Marks</th>
                <th className="px-4 py-3 font-semibold text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">No results recorded for this session.</td>
                </tr>
              ) : (
                results.map((r, i) => (
                  <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.subjectName}</td>
                    <td className="px-4 py-3 text-center">{r.marksObtained}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.maxMarks}</td>
                    <td className="px-4 py-3 text-center font-bold">{r.grade ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {results.length > 0 && (
              <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-3 text-right text-gray-900 uppercase">Total / Average</td>
                  <td className="px-4 py-3 text-center">{overall.totalMarks}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{overall.maximumMarks}</td>
                  <td className="px-4 py-3 text-center">{overall.average ? overall.average.toFixed(1) + '%' : '—'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Attendance & Comments Section */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {config.showAttendanceSummary && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">Attendance Summary</h2>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Present</p>
                    <p className="mt-1 text-xl font-bold text-success">{attendanceSummary.present}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Absent</p>
                    <p className="mt-1 text-xl font-bold text-error">{attendanceSummary.absent}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Late</p>
                    <p className="mt-1 text-xl font-bold text-amber-600">{attendanceSummary.late}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {config.showClassTeacherRemarks && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider border-b pb-2">Teacher Remarks</h2>
                <div className="min-h-[80px] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 italic">
                  Signature: __________________________
                </div>
              </div>
            )}
            
            {config.showPrincipalRemarks && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider border-b pb-2">Principal Remarks</h2>
                <div className="min-h-[80px] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 italic">
                  Signature: __________________________
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400 print:mt-16 border-t pt-4">
          <p>This report card is generated electronically and is valid without a physical signature. Issued on {new Date().toLocaleDateString()}.</p>
        </div>
      </div>
    </div>
  );
}
