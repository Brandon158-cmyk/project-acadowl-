'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import type { Id } from '@/../convex/_generated/dataModel';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

const studentEnrollmentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gradeId: z.string().min(1),
  sectionId: z.string().min(1),
  bloodType: z.string().optional().or(z.literal('')),
  medicalNotes: z.string().optional().or(z.literal('')),
  guardianFirstName: z.string().min(1),
  guardianLastName: z.string().min(1),
  guardianPhone: z.string().min(1),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianRelationship: z.enum(['parent', 'guardian', 'sibling', 'other']),
  guardianAddress: z.string().optional().or(z.literal('')),
  guardianPreferredContactMethod: z.enum(['sms', 'whatsapp', 'email']).optional(),
});

type StudentEnrollmentValues = z.infer<typeof studentEnrollmentSchema>;

export default function EnrollStudentPage() {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const formData = useQuery(api.students.queries.getEnrollmentFormData);
  const enrollStudent = useMutation(api.students.mutations.enrollStudent);

  const form = useForm<StudentEnrollmentValues>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      email: '',
      phone: '',
      gradeId: '',
      sectionId: '',
      bloodType: '',
      medicalNotes: '',
      guardianFirstName: '',
      guardianLastName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianRelationship: 'parent',
      guardianAddress: '',
      guardianPreferredContactMethod: 'sms',
    },
  });

  const selectedGradeId = useWatch({
    control: form.control,
    name: 'gradeId',
  });

  if (formData === undefined) {
    return <PageSkeleton />;
  }

  const gradeSections = formData.sections.filter((section) => section.gradeId === selectedGradeId);

  const handleSubmit = form.handleSubmit(async (values) => {
    setServerMessage(null);
    const result = await enrollStudent({
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: Date.parse(values.dateOfBirth),
      gender: values.gender,
      email: values.email || undefined,
      phone: values.phone || undefined,
      gradeId: values.gradeId as Id<'grades'>,
      sectionId: values.sectionId as Id<'sections'>,
      bloodType: values.bloodType || undefined,
      medicalNotes: values.medicalNotes || undefined,
      guardians: [
        {
          firstName: values.guardianFirstName,
          lastName: values.guardianLastName,
          phone: values.guardianPhone,
          email: values.guardianEmail || undefined,
          relationship: values.guardianRelationship,
          address: values.guardianAddress || undefined,
          preferredContactMethod: values.guardianPreferredContactMethod,
          isPrimary: true,
        },
      ],
    });

    setServerMessage(`Student enrolled successfully as ${result.studentNumber}.`);
    router.push(`/students/${result.studentId}`);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enroll student"
        description="Capture student identity, placement, and guardian contact details in one school-scoped flow."
        actions={
          <Link
            href="/students"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to students
          </Link>
        }
      />

      {serverMessage && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{serverMessage}</div>}

      <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Student details</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">First name</span>
              <input {...form.register('firstName')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Last name</span>
              <input {...form.register('lastName')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Date of birth</span>
              <input type="date" {...form.register('dateOfBirth')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Gender</span>
              <select {...form.register('gender')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input type="email" {...form.register('email')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input {...form.register('phone')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Grade</span>
              <select {...form.register('gradeId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select grade</option>
                {formData.grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>{grade.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Section</span>
              <select {...form.register('sectionId')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="">Select section</option>
                {gradeSections.map((section) => (
                  <option key={section._id} value={section._id}>{section.displayName ?? section.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Blood type</span>
              <input {...form.register('bloodType')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Medical notes</span>
              <textarea {...form.register('medicalNotes')} rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-onyx">Primary guardian</h2>
          <div className="mt-6 grid gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">First name</span>
              <input {...form.register('guardianFirstName')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Last name</span>
              <input {...form.register('guardianLastName')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input {...form.register('guardianPhone')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input type="email" {...form.register('guardianEmail')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Relationship</span>
              <select {...form.register('guardianRelationship')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Preferred contact</span>
              <select {...form.register('guardianPreferredContactMethod')} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20">
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Address</span>
              <textarea {...form.register('guardianAddress')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-school-primary focus:outline-none focus:ring-2 focus:ring-school-primary/20" />
            </label>
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-crimson-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save enrolment
          </button>
        </section>
      </form>
    </div>
  );
}
