'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { Calendar, Loader2, Plus, Users } from 'lucide-react';
import { z } from 'zod';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedbackBanner } from '@/components/shared/FeedbackBanner';
import { MetricCard } from '@/components/shared/MetricCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { SectionCard } from '@/components/shared/SectionCard';

const assignmentSchema = z.object({
  staffId: z.string().min(1),
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  isPrimaryTeacher: z.boolean().default(true),
});

const slotSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional().or(z.literal('')),
});

type AssignmentValues = z.infer<typeof assignmentSchema>;
type SlotValues = z.infer<typeof slotSchema>;

export default function TimetablePage() {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const builderData = useQuery(api.schools.timetable.getTimetableBuilderData);
  const assignmentData = useQuery(api.schools.assignments.getAssignmentFormData);
  const sectionTimetable = useQuery(
    api.schools.timetable.getTimetableForSection,
    selectedSectionId ? { sectionId: selectedSectionId as Id<'sections'> } : 'skip',
  );
  const sectionAssignments = useQuery(
    api.schools.assignments.getAssignmentsForSection,
    selectedSectionId ? { sectionId: selectedSectionId as Id<'sections'> } : 'skip',
  );

  const assignStaff = useMutation(api.schools.assignments.assignStaffToSubjectSection);
  const createSlot = useMutation(api.schools.timetable.createTimetableSlot);
  const deleteSlot = useMutation(api.schools.timetable.deleteTimetableSlot);
  const removeAssignment = useMutation(api.schools.assignments.removeStaffAssignment);

  const assignmentForm = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      staffId: '',
      subjectId: '',
      sectionId: '',
      isPrimaryTeacher: true,
    },
  });

  const slotForm = useForm<SlotValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      sectionId: '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: 0,
      startTime: '',
      endTime: '',
      room: '',
    },
  });

  const watchedAssignmentSectionId = useWatch({
    control: assignmentForm.control,
    name: 'sectionId',
  });

  const selectedSectionAssignments = sectionAssignments?.assignments ?? [];
  const selectedSectionSlots = sectionTimetable?.slots ?? [];
  const selectableSubjects = useMemo(() => {
    const section = assignmentData?.sections.find((entry) => entry._id === watchedAssignmentSectionId);
    if (!section || !assignmentData) return assignmentData?.subjects ?? [];
    return assignmentData.subjects.filter((subject) => subject.gradeIds?.includes(section.gradeId));
  }, [assignmentData, watchedAssignmentSectionId]);
  const timetableAssignmentOptions = selectedSectionAssignments;
  const groupedSlots = [0, 1, 2, 3, 4].map((day) => ({
    day,
    slots: selectedSectionSlots.filter((slot) => slot.dayOfWeek === day),
  }));

  if (builderData === undefined || assignmentData === undefined) {
    return <PageSkeleton />;
  }

  const activeSections = builderData.sections.length;
  const assignmentCount = builderData.assignments.length;

  const handleAssign = assignmentForm.handleSubmit(async (values) => {
    setMessage(null);
    await assignStaff({
      staffId: values.staffId as Id<'staff'>,
      subjectId: values.subjectId as Id<'subjects'>,
      sectionId: values.sectionId as Id<'sections'>,
      academicYearId: assignmentData.currentAcademicYear?._id,
      isPrimaryTeacher: values.isPrimaryTeacher,
    });
    assignmentForm.reset({ staffId: '', subjectId: '', sectionId: values.sectionId, isPrimaryTeacher: true });
    setSelectedSectionId(values.sectionId);
    setMessage('The staff assignment has been saved successfully.');
  });

  const handleCreateSlot = slotForm.handleSubmit(async (values) => {
    setMessage(null);
    await createSlot({
      sectionId: values.sectionId as Id<'sections'>,
      subjectId: values.subjectId as Id<'subjects'>,
      teacherId: values.teacherId ? (values.teacherId as Id<'staff'>) : undefined,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      room: values.room || undefined,
      termId: builderData.currentTerm?._id,
    });
    slotForm.reset({ sectionId: values.sectionId, subjectId: '', teacherId: '', dayOfWeek: values.dayOfWeek, startTime: '', endTime: '', room: '' });
    setSelectedSectionId(values.sectionId);
    setMessage('The timetable slot has been saved successfully.');
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable & Assignments"
        description="Assign teachers to sections and subjects, then build the section timetable for the active term."
      />

      {message ? <FeedbackBanner tone="success" title="Academic scheduling updated" description={message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active sections" value={String(activeSections)} helper="Sections available for assignment and timetable setup" icon={Users} />
        <MetricCard label="Assignments" value={String(assignmentCount)} helper="Teacher-subject-section assignments on file" icon={Users} />
        <MetricCard label="Current year" value={builderData.currentAcademicYear?.name ?? 'None'} helper="Academic year currently active" icon={Calendar} />
        <MetricCard label="Current term" value={builderData.currentTerm?.name ?? 'None'} helper="Term used for new timetable slots" icon={Calendar} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Assign teacher to section subject" description="Create the teaching assignments that power teacher workload and timetable setup.">
          <form className="space-y-4" onSubmit={(event) => void handleAssign(event)}>
            <div>
              <label htmlFor="assign-section" className="mb-1 block text-sm font-medium text-gray-700">Section</label>
              <select id="assign-section" {...assignmentForm.register('sectionId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select section</option>
                {assignmentData.sections.map((section) => (
                  <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assign-staff" className="mb-1 block text-sm font-medium text-gray-700">Teacher</label>
              <select id="assign-staff" {...assignmentForm.register('staffId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select teacher</option>
                {assignmentData.staff.map((staff) => (
                  <option key={staff._id} value={staff._id}>{staff.firstName} {staff.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assign-subject" className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <select id="assign-subject" {...assignmentForm.register('subjectId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select subject</option>
                {selectableSubjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input type="checkbox" {...assignmentForm.register('isPrimaryTeacher')} className="h-4 w-4 rounded border-gray-300 text-school-primary focus:ring-school-primary/20" />
              Primary teacher assignment
            </label>
            <button type="submit" disabled={assignmentForm.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {assignmentForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save assignment
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Build timetable slot" description="Create weekly timetable slots for the selected section using the teacher assignments already on file.">
          <form className="space-y-4" onSubmit={(event) => void handleCreateSlot(event)}>
            <div>
              <label htmlFor="slot-section" className="mb-1 block text-sm font-medium text-gray-700">Section</label>
              <select id="slot-section" {...slotForm.register('sectionId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select section</option>
                {assignmentData.sections.map((section) => (
                  <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="slot-subject" className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <select id="slot-subject" {...slotForm.register('subjectId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select subject</option>
                {timetableAssignmentOptions.map((assignment) => (
                  <option key={assignment._id} value={assignment.subjectId}>{assignment.subject?.name ?? 'Subject'}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="slot-teacher" className="mb-1 block text-sm font-medium text-gray-700">Teacher</label>
              <select id="slot-teacher" {...slotForm.register('teacherId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select teacher</option>
                {timetableAssignmentOptions.map((assignment) => (
                  <option key={assignment._id} value={assignment.staff?._id}>{assignment.staff ? `${assignment.staff.firstName} ${assignment.staff.lastName}` : 'Teacher'}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="dayOfWeek" className="mb-1 block text-sm font-medium text-gray-700">Day</label>
                <select id="dayOfWeek" {...slotForm.register('dayOfWeek')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                  {[0, 1, 2, 3, 4].map((day) => <option key={day} value={day}>Day {day + 1}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-gray-700">Start</label>
                <input id="startTime" type="time" {...slotForm.register('startTime')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
              <div>
                <label htmlFor="endTime" className="mb-1 block text-sm font-medium text-gray-700">End</label>
                <input id="endTime" type="time" {...slotForm.register('endTime')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
              </div>
            </div>
            <div>
              <label htmlFor="room" className="mb-1 block text-sm font-medium text-gray-700">Room</label>
              <input id="room" type="text" {...slotForm.register('room')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </div>
            <button type="submit" disabled={slotForm.formState.isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
              {slotForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save timetable slot
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Section schedule review" description="Select a section to review its current assignments and timetable slots.">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="selected-section" className="mb-1 block text-sm font-medium text-gray-700">Section review</label>
            <select id="selected-section" value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
              <option value="">Select section</option>
              {assignmentData.sections.map((section) => (
                <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedSectionId ? (
          <div className="mt-6">
            <EmptyState icon={Calendar} title="No section selected" description="Select a section to review its teacher assignments and timetable slots." />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="font-serif text-xl font-semibold text-onyx">Teacher assignments</h3>
              <div className="mt-3 space-y-3">
                {selectedSectionAssignments.length === 0 ? (
                  <p className="text-sm text-slate">No teacher assignments have been created for this section yet.</p>
                ) : (
                  selectedSectionAssignments.map((assignment) => (
                    <div key={assignment._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-onyx">{assignment.subject?.name ?? 'Subject'}</p>
                          <p className="mt-1 text-sm text-slate">{assignment.staff ? `${assignment.staff.firstName} ${assignment.staff.lastName}` : 'Teacher not found'}</p>
                        </div>
                        <button type="button" onClick={() => void removeAssignment({ assignmentId: assignment._id })} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 active:scale-95">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-onyx">Timetable slots</h3>
              <div className="mt-3 space-y-3">
                {selectedSectionSlots.length === 0 ? (
                  <p className="text-sm text-slate">No timetable slots have been created for this section yet.</p>
                ) : (
                  groupedSlots.map((group) => (
                    <div key={group.day} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="font-medium text-onyx">Day {group.day + 1}</p>
                      <div className="mt-3 space-y-3">
                        {group.slots.length === 0 ? (
                          <p className="text-sm text-slate">No slots scheduled.</p>
                        ) : (
                          group.slots.map((slot) => (
                            <div key={slot._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-onyx">{slot.subject?.name ?? 'Subject'}</p>
                                  <p className="mt-1 text-sm text-slate">{slot.startTime} - {slot.endTime}{slot.room ? ` · Room ${slot.room}` : ''}</p>
                                </div>
                                <button type="button" onClick={() => void deleteSlot({ slotId: slot._id })} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:bg-red-50 active:scale-95">Delete</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
