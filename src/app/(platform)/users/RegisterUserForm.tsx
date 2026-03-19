'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, CheckCircle2, Copy } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Doc } from '@/../convex/_generated/dataModel';

const roles = [
  { value: 'school_admin', label: 'School Admin' },
  { value: 'deputy_head', label: 'Deputy Head' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'matron', label: 'Matron' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'driver', label: 'Driver' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'student', label: 'Student' },
] as const;

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional(),
  role: z.enum([
    'school_admin', 'deputy_head', 'bursar', 'teacher', 'class_teacher',
    'matron', 'librarian', 'driver', 'guardian', 'student',
  ]),
  schoolId: z.string().min(1, 'Select a school'),
  tempPassword: z.string().min(8, 'Minimum 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterUserFormProps {
  schools: Doc<'schools'>[];
  onClose: () => void;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function RegisterUserForm({ schools, onClose }: RegisterUserFormProps) {
  const adminCreateUser = useAction(api.users.actions.adminCreateUser);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'teacher',
      schoolId: '',
      tempPassword: generateTempPassword(),
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await adminCreateUser({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role,
        schoolId: data.schoolId as never,
        tempPassword: data.tempPassword,
      });

      setSuccess({ email: data.email, tempPassword: data.tempPassword });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      form.setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!success) return;
    const text = `Email: ${success.email}\nTemporary Password: ${success.tempPassword}\n\nPlease sign in at your school portal and you will be prompted to set a new password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass =
    'block w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm';
  const selectClass =
    'block w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-semibold text-onyx">Register User</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-onyx">User created</h3>
              <p className="mt-1 text-sm text-slate">
                Share these temporary credentials with the user. They will be prompted to set a new password on first login.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="text-sm font-mono text-onyx">{success.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Temporary password</p>
                <p className="text-sm font-mono text-onyx">{success.tempPassword}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={copyCredentials}
                className="bg-white hover:bg-gray-50 text-onyx border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2"
              >
                <Copy size={16} />
                {copied ? 'Copied' : 'Copy credentials'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input id="user-name" type="text" className={inputClass} placeholder="Full name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input id="user-email" type="email" className={inputClass} placeholder="user@school.edu.zm" {...form.register('email')} />
              {form.formState.errors.email && (
                <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone number (optional)
              </label>
              <input id="user-phone" type="tel" className={inputClass} placeholder="+260 97..." {...form.register('phone')} />
            </div>

            {/* Role + School */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select id="user-role" className={selectClass} {...form.register('role')}>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="user-school" className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <select id="user-school" className={selectClass} {...form.register('schoolId')}>
                  <option value="">Select school</option>
                  {schools.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                {form.formState.errors.schoolId && (
                  <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.schoolId.message}</p>
                )}
              </div>
            </div>

            {/* Temp password */}
            <div>
              <label htmlFor="user-temp-pw" className="block text-sm font-medium text-gray-700 mb-1">
                Temporary password
              </label>
              <div className="flex gap-2">
                <input id="user-temp-pw" type="text" className={inputClass} {...form.register('tempPassword')} />
                <button
                  type="button"
                  onClick={() => form.setValue('tempPassword', generateTempPassword())}
                  className="shrink-0 bg-white hover:bg-gray-50 text-onyx border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm active:scale-95"
                >
                  Regenerate
                </button>
              </div>
              {form.formState.errors.tempPassword && (
                <p role="alert" className="mt-1.5 text-xs text-error">{form.formState.errors.tempPassword.message}</p>
              )}
              <p className="mt-1.5 text-xs text-slate">
                The user will be required to change this on first login.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-gray-50 text-onyx border border-gray-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-school-primary hover:bg-crimson-dark text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating...
                  </>
                ) : (
                  'Register user'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
