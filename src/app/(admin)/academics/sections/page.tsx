'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { AlertCircle, BookOpen, Loader2, Plus, Users } from 'lucide-react';
import { z } from 'zod';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

const sectionSchema = z.object({
  gradeId: z.string().min(1),
  academicYearId: z.string().optional(),
  name: z.string().min(1),
  displayName: z.string().optional().or(z.literal('')),
  roomNumber: z.string().optional().or(z.literal('')),
  maxStudents: z.coerce.number().int().min(1),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

export default function SectionsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const managementData = useQuery(api.schools.sections.getSectionManagementData);
  const createSection = useMutation(api.schools.sections.createSection);
  const assignClassTeacher = useMutation(api.schools.sections.assignClassTeacher);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      gradeId: '',
      academicYearId: '',
      name: '',
      displayName: '',
      roomNumber: '',
      maxStudents: 40,
    },
  });

  const grades = managementData?.grades ?? [];
  const academicYears = managementData?.academicYears ?? [];
  const sections = managementData?.sections ?? [];
  const groupedSections = grades.map((grade) => ({
    grade,
    sections: sections.filter((section) => section.grade?._id === grade._id),
  }));
  const selectedSection = sections.find((section) => section._id === selectedSectionId) ?? null;
  const activeSections = sections.filter((section) => section.isActive).length;
  const unassignedSections = sections.filter((section) => !section.classTeacherId).length;

  if (managementData === undefined) {
    return <PageSkeleton />;
  }

  const handleCreateSection = form.handleSubmit(async (values) => {
    setMessage(null);
    await createSection({
      gradeId: values.gradeId as Id<'grades'>,
      academicYearId: values.academicYearId ? (values.academicYearId as Id<'academicYears'>) : undefined,
      name: values.name,
      displayName: values.displayName || undefined,
      roomNumber: values.roomNumber || undefined,
      maxStudents: values.maxStudents,
    });
    form.reset({ ...values, name: '', displayName: '', roomNumber: '' });
    setMessage('The section has been saved successfully.');
  });

  const handleAssignTeacher = async (sectionId: Id<'sections'>, staffId: string) => {
    setMessage(null);
    if (!staffId) return;
    await assignClassTeacher({ sectionId, staffId: staffId as Id<'staff'> });
    setMessage('The class teacher assignment has been saved successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Create class sections within each grade and track class teacher allocation and student capacity."
      />

      {message ? <FeedbackBanner tone="success" title="Section management updated" description={message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Configured sections" value={String(sections.length)} helper="All section records available for this school" icon={BookOpen} />
        <MetricCard label="Active sections" value={String(activeSections)} helper="Sections currently open for placement" icon={BookOpen} />
        <MetricCard label="Unassigned sections" value={String(unassignedSections)} helper="Sections without a class teacher" icon={AlertCircle} />
        <MetricCard label="Grades covered" value={String(groupedSections.filter((group) => group.sections.length > 0).length)} helper="Grades with at least one section configured" icon={Users} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Create section" description="Add section records before assigning teachers or placing students.">
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleCreateSection(event)}>
            <div>
              <label htmlFor="gradeId" className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
              <select id="gradeId" {...form.register('gradeId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select grade</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>{grade.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="academicYearId" className="mb-1 block text-sm font-medium text-gray-700">Academic year</label>
              <select id="academicYearId" {...form.register('academicYearId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Not specified</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>{year.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Section name</label>
                <input id="name" type="text" {...form.register('name')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-gray-700">Display name</label>
                <input id="displayName" type="text" {...form.register('displayName')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="roomNumber" className="mb-1 block text-sm font-medium text-gray-700">Room number</label>
                <input id="roomNumber" type="text" {...form.register('roomNumber')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
              <div>
                <label htmlFor="maxStudents" className="mb-1 block text-sm font-medium text-gray-700">Capacity</label>
                <input id="maxStudents" type="number" {...form.register('maxStudents')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
            </div>
            <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save section
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Configured sections" description="Sections are grouped by grade with class teacher assignment and live capacity indicators.">
          {sections.length === 0 ? (
            <EmptyState icon={BookOpen} title="No sections configured" description="Create the first section to start placing students into classes." />
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="selected-grade" className="mb-1 block text-sm font-medium text-gray-700">Filter by grade</label>
                <select id="selected-grade" value={selectedGradeId} onChange={(event) => setSelectedGradeId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                  <option value="">All grades</option>
                  {grades.map((grade) => <option key={grade._id} value={grade._id}>{grade.name}</option>)}
                </select>
              </div>

              <div className="space-y-6">
                {groupedSections
                  .filter((group) => !selectedGradeId || group.grade._id === selectedGradeId)
                  .map((group) => (
                    <div key={group.grade._id} className="space-y-4">
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-onyx">{group.grade.name}</h3>
                        <p className="mt-1 text-sm text-slate">{group.sections.length} configured section{group.sections.length === 1 ? '' : 's'}</p>
                      </div>
                      {group.sections.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-slate">No sections have been configured for this grade yet.</div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {group.sections.map((section) => {
                            const usagePercent = Math.min(100, Math.round((section.enrolled / section.maxStudents) * 100) || 0);
                            return (
                              <div key={section._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-medium text-onyx">{section.displayName ?? section.name}</p>
                                    <p className="mt-1 text-sm text-slate">{section.roomNumber ? `Room ${section.roomNumber}` : 'Room not assigned'}</p>
                                  </div>
                                  {!section.classTeacher ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Teacher needed</span> : null}
                                </div>
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center justify-between text-sm text-slate">
                                    <span>Capacity</span>
                                    <span>{section.enrolled}/{section.maxStudents}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-gray-100">
                                    <div className="h-2 rounded-full bg-school-primary" style={{ width: `${usagePercent}%` }} />
                                  </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                  <div>
                                    <label htmlFor={`teacher-${section._id}`} className="mb-1 block text-sm font-medium text-gray-700">Class teacher</label>
                                    <select id={`teacher-${section._id}`} defaultValue={section.classTeacherId ?? ''} onChange={(event) => void handleAssignTeacher(section._id, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                                      <option value="">Unassigned</option>
                                      {managementData.teachers.map((teacher) => (
                                        <option key={teacher._id} value={teacher._id}>{teacher.firstName} {teacher.lastName}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <button type="button" onClick={() => setSelectedSectionId(section._id)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95">
                                    <Users className="h-4 w-4" />
                                    Review roster
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Section roster review" description="Inspect the selected section roster and identify placement pressure before transfers or timetable planning.">
        {!selectedSection ? (
          <EmptyState icon={Users} title="No section selected" description="Use the review action on any section card to inspect its current roster and capacity." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium text-onyx">{selectedSection.displayName ?? selectedSection.name}</p>
                <p className="mt-1 text-sm text-slate">{selectedSection.grade?.name ?? 'Unknown grade'} · {selectedSection.academicYear?.name ?? 'Academic year not set'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Available seats</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-onyx">{selectedSection.available}</p>
              </div>
            </div>
            {selectedSection.roster.length === 0 ? (
              <EmptyState icon={Users} title="No students placed" description="Students assigned to this section will appear here." />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Student</th>
                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSection.roster.map((student) => (
                        <tr key={student._id} className="transition-colors hover:bg-gray-50/50">
                          <td className="p-4">
                            <p className="font-medium text-onyx">{student.firstName} {student.lastName}</p>
                            <p className="mt-1 font-mono text-xs text-gray-500">{student.studentNumber}</p>
                          </td>
                          <td className="p-4 text-sm capitalize text-slate">{student.enrollmentStatus.replace('_', ' ')}</td>
                          <td className="p-4 text-right"><a href={`/students/${student._id}`} className="text-sm font-medium text-school-primary transition-all duration-200 hover:underline">Open student</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
