'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        form.setError('root', { message: 'Incorrect email or password. Please try again.' });
        return;
      }

      const user = await resolveProfile();
      if (user?.isFirstLogin) {
        router.push('/reset-password');
      } else {
        const role = user?.role as string | undefined;
        const ROLE_DASHBOARDS: Record<string, string> = {
          platform_admin: '/schools',
          teacher: '/my-classes',
          class_teacher: '/my-classes',
          guardian: '/home',
          student: '/portal',
        };
        router.push(role ? (ROLE_DASHBOARDS[role] ?? '/dashboard') : '/dashboard');
      }
      router.refresh();
    } catch {
      form.setError('root', { message: 'Something went wrong. Please try again shortly.' });
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
        <label htmlFor="email" className="block text-sm font-medium text-onyx mb-1.5">
          Email address
        </label>
        <input
          {...form.register('email')}
          type="email"
          id="email"
          autoComplete="email"
          className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
          placeholder="you@school.edu.zm"
        />
        {form.formState.errors.email && (
          <p role="alert" className="mt-1.5 text-xs text-error">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-onyx mb-1.5">
          Password
        </label>
        <input
          {...form.register('password')}
          type="password"
          id="password"
          autoComplete="current-password"
          className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
        />
        {form.formState.errors.password && (
          <p role="alert" className="mt-1.5 text-xs text-error">
            {form.formState.errors.password.message}
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
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
