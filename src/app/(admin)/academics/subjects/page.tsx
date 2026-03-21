'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  isCompulsory: z.boolean().default(true),
  isStemSubject: z.boolean().default(false),
  eczSubjectCode: z.string().optional().or(z.literal('')),
  gradeIds: z.array(z.string()).min(1),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function SubjectsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const subjects = useQuery(api.schools.subjects.getSubjectsBySchool);
  const grades = useQuery(api.schools.grades.getGradesBySchool);
  const seedDefaultSubjects = useMutation(api.schools.subjects.seedDefaultSubjects);
  const createSubject = useMutation(api.schools.subjects.createSubject);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      code: '',
      isCompulsory: true,
      isStemSubject: false,
      eczSubjectCode: '',
      gradeIds: [],
    },
  });

  if (subjects === undefined || grades === undefined) {
    return <PageSkeleton />;
  }

  const handleCreateSubject = form.handleSubmit(async (values) => {
    setMessage(null);
    await createSubject({
      name: values.name,
      code: values.code,
      gradeIds: values.gradeIds as Id<'grades'>[],
      isCompulsory: values.isCompulsory,
      isStemSubject: values.isStemSubject,
      eczSubjectCode: values.eczSubjectCode || undefined,
      category: values.isCompulsory ? 'core' : 'elective',
    });
    form.reset({ name: '', code: '', isCompulsory: true, isStemSubject: false, eczSubjectCode: '', gradeIds: [] });
    setMessage('The subject has been saved successfully.');
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Manage the subject registry that powers timetables, examinations, and future LMS course structure."
        actions={
          <button
            type="button"
            onClick={() => void seedDefaultSubjects({})}
            disabled={subjects.length > 0 || grades.length === 0}
            className="rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Import MoE defaults
          </button>
        }
      />

      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Create subject</h2>
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateSubject(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input id="name" type="text" {...form.register('name')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">Short code</label>
                <input id="code" type="text" {...form.register('code')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
            </div>
            <div>
              <label htmlFor="eczSubjectCode" className="mb-1 block text-sm font-medium text-gray-700">ECZ subject code</label>
              <input id="eczSubjectCode" type="text" {...form.register('eczSubjectCode')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Grade assignment</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {grades.map((grade) => (
                  <label key={grade._id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                    <input type="checkbox" value={grade._id} {...form.register('gradeIds')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />
                    {grade.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" {...form.register('isCompulsory')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />Compulsory subject</label>
            <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" {...form.register('isStemSubject')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />STEM subject</label>
            <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save subject
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Configured subjects</h2>
          {subjects.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={BookOpen} title="No subjects configured" description="Seed defaults once grades are ready, or create a custom subject manually for this school." />
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Subject</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Code</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Assignments</th>
                      <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subjects.map((subject) => (
                      <tr key={subject._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-sm text-gray-600">{subject.isCompulsory ? 'Compulsory' : 'Elective'}</p>
                        </td>
                        <td className="p-4 font-mono text-sm text-gray-500">{subject.code}</td>
                        <td className="p-4 text-sm text-gray-600">{subject.teacherAssignmentCount} teacher assignments</td>
                        <td className="p-4 text-right text-sm text-gray-600">{subject.recentExamAverage === null ? '—' : `${subject.recentExamAverage.toFixed(1)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
