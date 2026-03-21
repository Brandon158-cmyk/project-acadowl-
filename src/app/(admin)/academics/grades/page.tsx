'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { GraduationCap, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

const gradeSchema = z.object({
  name: z.string().min(1),
  level: z.coerce.number().int().min(1),
  graduationGrade: z.boolean().default(false),
  isEczExamYear: z.boolean().default(false),
  hasPracticalAssessment: z.boolean().default(false),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

export default function GradesPage() {
  const [message, setMessage] = useState<string | null>(null);
  const grades = useQuery(api.schools.grades.getGradesBySchool);
  const seedDefaultGrades = useMutation(api.schools.grades.seedDefaultGrades);
  const createGrade = useMutation(api.schools.grades.createGrade);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: '',
      level: 1,
      graduationGrade: false,
      isEczExamYear: false,
      hasPracticalAssessment: false,
    },
  });

  if (grades === undefined) {
    return <PageSkeleton />;
  }

  const graduationGrades = grades.filter((grade) => grade.graduationGrade).length;
  const examGrades = grades.filter((grade) => grade.isEczExamYear).length;

  const handleCreateGrade = form.handleSubmit(async (values) => {
    setMessage(null);
    await createGrade(values);
    form.reset({ ...values, name: '', level: values.level + 1 });
    setMessage('The grade has been saved successfully.');
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        description="Configure the grade ladder used for class placement, curriculum assignment, and downstream fee and results logic."
        actions={
          <button
            type="button"
            onClick={() => void seedDefaultGrades({})}
            disabled={grades.length > 0}
            className="rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Seed default grades
          </button>
        }
      />

      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Configured grades" value={String(grades.length)} helper="Current grade ladder available for academic setup" icon={GraduationCap} />
        <MetricCard label="Graduation grades" value={String(graduationGrades)} helper="Terminal or transition grades configured" icon={GraduationCap} />
        <MetricCard label="ECZ exam years" value={String(examGrades)} helper="Grades marked for ECZ exam-year workflows" icon={GraduationCap} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Create grade</h2>
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateGrade(event)}>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input id="name" type="text" {...form.register('name')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </div>
            <div>
              <label htmlFor="level" className="mb-1 block text-sm font-medium text-gray-700">Level</label>
              <input id="level" type="number" {...form.register('level')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" {...form.register('graduationGrade')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />Graduation grade</label>
            <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" {...form.register('isEczExamYear')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />ECZ exam year</label>
            <label className="flex items-center gap-3 text-sm text-gray-700"><input type="checkbox" {...form.register('hasPracticalAssessment')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />Practical assessment required</label>
            <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save grade
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Configured grades</h2>
          {grades.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={GraduationCap} title="No grades configured" description="Seed defaults or create the first grade manually to begin section and subject setup." />
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Grade</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Level</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grades.map((grade) => (
                      <tr key={grade._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-900">{grade.name}</td>
                        <td className="p-4 font-mono text-sm text-gray-500">{grade.level}</td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {grade.graduationGrade && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Graduation</span>}
                            {grade.isEczExamYear && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">ECZ</span>}
                            {grade.hasPracticalAssessment && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">Practical</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-500">
                <span>Showing {grades.length} configured grade{grades.length === 1 ? '' : 's'}</span>
                <span>Seed defaults once or maintain the ladder manually.</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
