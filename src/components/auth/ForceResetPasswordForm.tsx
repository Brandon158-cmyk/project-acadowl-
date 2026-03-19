'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export function ForceResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const completeFirstLogin = useMutation(api.users.mutations.completeFirstLogin);
  const me = useQuery(api.users.queries.me);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        form.setError('root', { message: error.message });
        return;
      }

      await completeFirstLogin();
      const role = me?.role as string | undefined;
      const ROLE_DASHBOARDS: Record<string, string> = {
        platform_admin: '/schools',
        teacher: '/my-classes',
        class_teacher: '/my-classes',
        guardian: '/home',
        student: '/portal',
      };
      router.push(role ? (ROLE_DASHBOARDS[role] ?? '/dashboard') : '/dashboard');
      router.refresh();
    } catch {
      form.setError('root', { message: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {form.formState.errors.root && (
        <div
          role="alert"
          className="rounded-lg bg-error-light px-4 py-3 text-sm text-error"
        >
          {form.formState.errors.root.message}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-onyx mb-1.5">
          New password
        </label>
        <input
          {...form.register('password')}
          type="password"
          id="password"
          autoComplete="new-password"
          className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
          placeholder="Minimum 8 characters"
        />
        {form.formState.errors.password && (
          <p role="alert" className="mt-1.5 text-xs text-error">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-onyx mb-1.5">
          Confirm new password
        </label>
        <input
          {...form.register('confirmPassword')}
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
          placeholder="Re-enter your new password"
        />
        {form.formState.errors.confirmPassword && (
          <p role="alert" className="mt-1.5 text-xs text-error">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center h-11 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Setting password...
          </>
        ) : (
          'Set new password'
        )}
      </button>
    </form>
  );
}
