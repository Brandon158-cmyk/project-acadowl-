'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        form.setError('root', { message: 'We couldn\u2019t process your request. Please try again.' });
        return;
      }

      setIsSubmitted(true);
    } catch {
      form.setError('root', { message: 'Something went wrong. Please try again shortly.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
          <svg
            className="h-6 w-6 text-success"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-onyx">Check your inbox</h2>
        <p className="mt-2 text-sm text-slate">
          If an account exists with that email, you&apos;ll receive reset instructions shortly.
        </p>
      </div>
    );
  }

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
        <label htmlFor="reset-email" className="block text-sm font-medium text-onyx mb-1.5">
          Email address
        </label>
        <input
          {...form.register('email')}
          type="email"
          id="reset-email"
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

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center h-11 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          'Send reset link'
        )}
      </button>
    </form>
  );
}
