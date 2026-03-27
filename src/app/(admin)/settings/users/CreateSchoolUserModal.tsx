'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Loader2, RefreshCw, X, Copy, CheckCircle2 } from 'lucide-react';

const roleOptions = [
  { value: 'school_admin', label: 'School Admin' },
  { value: 'deputy_head', label: 'Deputy Head' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'matron', label: 'Matron' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'driver', label: 'Driver' },
  { value: 'guardian', label: 'Parent/Guardian' },
  { value: 'student', label: 'Student' },
] as const;

type SchoolManagedRole = (typeof roleOptions)[number]['value'];

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface CreateSchoolUserModalProps {
  onClose: () => void;
}

export function CreateSchoolUserModal({ onClose }: CreateSchoolUserModalProps) {
  const createUser = useAction(api.users.actions.schoolAdminCreateUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<SchoolManagedRole>('teacher');
  const [tempPassword, setTempPassword] = useState(generateTempPassword());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length > 3 && tempPassword.trim().length >= 8;
  }, [email, name, tempPassword]);

  const regeneratePassword = () => {
    setTempPassword(generateTempPassword());
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsLoading(true);

    try {
      await createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim() : undefined,
        role,
        tempPassword,
      });

      setCreated({ email: email.trim().toLowerCase(), tempPassword });
      setName('');
      setEmail('');
      setPhone('');
      setRole('teacher');
      setTempPassword(generateTempPassword());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = async () => {
    if (!created) return;
    const text = `Email: ${created.email}\nTemporary Password: ${created.tempPassword}\n\nPlease sign in and change this password immediately.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = 'block w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="relative z-50 w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-onyx">Create School User</h2>
            <p className="text-sm text-slate">Provision staff, guardians, and learners in your school scope.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate hover:bg-gray-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">User created successfully</p>
                  <p className="mt-1 text-sm text-emerald-800">Share these credentials securely with the new user.</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                <p><span className="font-medium">Email:</span> {created.email}</p>
                <p><span className="font-medium">Temporary Password:</span> {created.tempPassword}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy credentials'}
              </button>
              <button
                type="button"
                onClick={() => setCreated(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-3 py-2 text-sm font-medium text-white"
              >
                Create another user
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="John Phiri" required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.zm" required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2609XXXXXXXX" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as SchoolManagedRole)}>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Temporary password</label>
                <div className="flex gap-2">
                  <input className={inputClass} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} minLength={8} required />
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
                    aria-label="Regenerate password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-school-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create user
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
