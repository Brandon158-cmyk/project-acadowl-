'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { CalendarDays, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

const academicYearSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  label: z.string().max(80).optional().or(z.literal('')),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const termSchema = z.object({
  academicYearId: z.string().min(1),
  terms: z
    .array(
      z.object({
        name: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
      }),
    )
    .min(2)
    .max(4),
});

type AcademicYearFormValues = z.infer<typeof academicYearSchema>;
type TermFormValues = z.infer<typeof termSchema>;

function StatusBadge({ label, tone }: { label: string; tone: 'green' | 'gray' | 'blue' | 'amber' }) {
  const toneClasses = {
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
  } as const;

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>{label}</span>;
}

export default function AcademicYearSettingsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const academicYears = useQuery(api.schools.academicYears.getAcademicYears);
  const currentAcademicYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const currentTerm = useQuery(api.schools.terms.getCurrentTerm);
  const createAcademicYear = useMutation(api.schools.academicYears.createAcademicYear);
  const activateAcademicYear = useMutation(api.schools.academicYears.activateAcademicYear);
  const closeAcademicYear = useMutation(api.schools.academicYears.closeAcademicYear);
  const createTerms = useMutation(api.schools.terms.createTerms);

  const selectedAcademicYearId = currentAcademicYear?._id ?? academicYears?.[0]?._id;
  const selectedTerms = useQuery(
    api.schools.terms.getTermsByYear,
    selectedAcademicYearId ? { academicYearId: selectedAcademicYearId } : 'skip',
  );

  const yearForm = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      label: '',
      startDate: '',
      endDate: '',
    },
  });

  const termForm = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    values: {
      academicYearId: selectedAcademicYearId ?? '',
      terms: [
        { name: 'Term 1', startDate: '', endDate: '' },
        { name: 'Term 2', startDate: '', endDate: '' },
        { name: 'Term 3', startDate: '', endDate: '' },
      ],
    },
  });

  const fieldArray = useFieldArray({ control: termForm.control, name: 'terms' });

  const canCreateTerms = useMemo(
    () => Boolean(selectedAcademicYearId) && (selectedTerms?.length ?? 0) === 0,
    [selectedAcademicYearId, selectedTerms],
  );

  if (academicYears === undefined || currentAcademicYear === undefined || currentTerm === undefined) {
    return <PageSkeleton />;
  }

  const closedYears = academicYears.filter((year) => year.status === 'closed').length;

  const handleCreateAcademicYear = yearForm.handleSubmit(async (values) => {
    setMessage(null);
    await createAcademicYear(values);
    yearForm.reset({
      year: values.year + 1,
      label: '',
      startDate: '',
      endDate: '',
    });
    setMessage('The academic year has been saved successfully.');
  });

  const handleCreateTerms = termForm.handleSubmit(async (values) => {
    setMessage(null);
    await createTerms({
      academicYearId: values.academicYearId as Id<'academicYears'>,
      terms: values.terms.map((term) => ({
        name: term.name,
        startDate: Date.parse(term.startDate),
        endDate: Date.parse(term.endDate),
      })),
    });
    setMessage('The term structure has been saved successfully.');
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Year Settings"
        description="Configure the academic calendar that drives enrolment, attendance, examinations, and term-scoped operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Academic years" value={String(academicYears.length)} helper="Configured year records in this school" icon={CalendarDays} />
        <MetricCard label="Closed years" value={String(closedYears)} helper="Historical years that are no longer operational" icon={CalendarDays} />
        <MetricCard label="Current year" value={currentAcademicYear?.name ?? 'None'} helper="The active year for current operations" icon={CalendarDays} />
        <MetricCard label="Current term" value={currentTerm?.name ?? 'None'} helper={currentTerm ? `${currentTerm.daysRemaining} days remaining` : 'No active term'} icon={CalendarDays} />
      </div>

      {!currentAcademicYear && (
        <FeedbackBanner tone="warning" title="No academic year is active yet" description="Activate one year before operational workflows begin so current term and placement context can be derived correctly." />
      )}

      {message && <FeedbackBanner tone="success" title="The academic calendar has been updated" description={message} />}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-onyx">Academic years</h2>
              <p className="mt-1 text-sm text-gray-600">Activate one year at a time and close historical years without deleting data.</p>
            </div>
            {currentTerm && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Current term</p>
                <p className="font-medium text-onyx">{currentTerm.name}</p>
                <p className="text-sm text-gray-600">{currentTerm.daysRemaining} days remaining</p>
              </div>
            )}
          </div>

          {academicYears.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No academic years yet"
              description="Create the first academic year to unlock term configuration and downstream academic workflows."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Year</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Range</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {academicYears.map((year) => (
                      <tr key={year._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-900">{year.name}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <StatusBadge
                            label={year.status === 'active' ? 'Active' : year.status === 'closed' ? 'Closed' : 'Draft'}
                            tone={year.status === 'active' ? 'green' : year.status === 'closed' ? 'gray' : 'blue'}
                          />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {!year.isCurrent && year.status !== 'closed' && (
                              <button
                                type="button"
                                onClick={() => void activateAcademicYear({ academicYearId: year._id })}
                                className="rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95"
                              >
                                Activate
                              </button>
                            )}
                            {year.status !== 'closed' && (
                              <button
                                type="button"
                                onClick={() => void closeAcademicYear({ academicYearId: year._id })}
                                className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 active:scale-95"
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-2xl font-semibold text-onyx">Create academic year</h2>
            <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateAcademicYear(event)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                  <input id="year" type="number" {...yearForm.register('year')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                </div>
                <div>
                  <label htmlFor="label" className="mb-1 block text-sm font-medium text-gray-700">Label</label>
                  <input id="label" type="text" {...yearForm.register('label')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                </div>
                <div>
                  <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-gray-700">Start date</label>
                  <input id="startDate" type="date" {...yearForm.register('startDate')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                </div>
                <div>
                  <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-gray-700">End date</label>
                  <input id="endDate" type="date" {...yearForm.register('endDate')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                </div>
              </div>
              <button type="submit" disabled={yearForm.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
                {yearForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save academic year
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-onyx">Terms</h2>
                <p className="mt-1 text-sm text-gray-600">Create the operational terms for the selected academic year.</p>
              </div>
              <div className="min-w-48">
                <label htmlFor="academicYearId" className="mb-1 block text-sm font-medium text-gray-700">Selected year</label>
                <select id="academicYearId" {...termForm.register('academicYearId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                  <option value="">Select an academic year</option>
                  {academicYears.map((year) => (
                    <option key={year._id} value={year._id}>{year.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTerms && selectedTerms.length > 0 && (
              <div className="mt-6 space-y-3">
                {selectedTerms.map((term) => (
                  <div key={term._id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-onyx">{term.name}</p>
                      <p className="text-sm text-gray-600">{new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge label={term.status === 'active' ? 'Active' : term.status === 'closed' ? 'Closed' : 'Upcoming'} tone={term.status === 'active' ? 'green' : term.status === 'closed' ? 'gray' : 'blue'} />
                  </div>
                ))}
              </div>
            )}

            {canCreateTerms && (
              <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateTerms(event)}>
                {fieldArray.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 rounded-xl border border-gray-200 p-4 md:grid-cols-[1.2fr_1fr_1fr]">
                    <div>
                      <label htmlFor={`terms.${index}.name`} className="mb-1 block text-sm font-medium text-gray-700">Term name</label>
                      <input id={`terms.${index}.name`} type="text" {...termForm.register(`terms.${index}.name`)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                    </div>
                    <div>
                      <label htmlFor={`terms.${index}.startDate`} className="mb-1 block text-sm font-medium text-gray-700">Start date</label>
                      <input id={`terms.${index}.startDate`} type="date" {...termForm.register(`terms.${index}.startDate`)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                    </div>
                    <div>
                      <label htmlFor={`terms.${index}.endDate`} className="mb-1 block text-sm font-medium text-gray-700">End date</label>
                      <input id={`terms.${index}.endDate`} type="date" {...termForm.register(`terms.${index}.endDate`)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={termForm.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
                  {termForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save terms
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
