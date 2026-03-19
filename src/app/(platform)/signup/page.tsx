'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { AuthLayout } from '@/components/layout/AuthLayout';

const inviteKeySchema = z.object({
  inviteKey: z.string().min(1, 'Invite key is required'),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteKeyData = z.infer<typeof inviteKeySchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function PlatformSignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const createPlatformAdmin = useMutation(api.users.mutations.createPlatformAdmin);

  const [step, setStep] = useState<'key' | 'signup'>('key');
  const [inviteKey, setInviteKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const keyForm = useForm<InviteKeyData>({
    resolver: zodResolver(inviteKeySchema),
    defaultValues: { inviteKey: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onKeySubmit = (data: InviteKeyData) => {
    setInviteKey(data.inviteKey);
    setStep('signup');
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { role: 'platform_admin', name: data.name },
        },
      });

      if (signUpError || !authData.user) {
        signupForm.setError('root', {
          message: signUpError?.message ?? 'Failed to create account',
        });
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const tokenIdentifier = `${supabaseUrl}|${authData.user.id}`;

      await createPlatformAdmin({
        tokenIdentifier,
        supabaseId: authData.user.id,
        name: data.name,
        email: data.email,
        inviteKey,
      });

      router.push('/schools');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      signupForm.setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'key') {
    return (
      <AuthLayout>
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-school-primary/10">
            <ShieldCheck className="h-6 w-6 text-school-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-onyx">
            Platform Admin Access
          </h1>
          <p className="mt-2 text-sm text-slate">
            Enter your invite key to create a platform admin account
          </p>
        </div>

        <form onSubmit={keyForm.handleSubmit(onKeySubmit)} className="space-y-5">
          {keyForm.formState.errors.root && (
            <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              {keyForm.formState.errors.root.message}
            </div>
          )}

          <div>
            <label htmlFor="inviteKey" className="block text-sm font-medium text-onyx mb-1.5">
              Invite key
            </label>
            <input
              {...keyForm.register('inviteKey')}
              type="password"
              id="inviteKey"
              autoComplete="off"
              className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
              placeholder="Enter your invite key"
            />
            {keyForm.formState.errors.inviteKey && (
              <p role="alert" className="mt-1.5 text-xs text-error">
                {keyForm.formState.errors.inviteKey.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center h-11 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200"
          >
            Continue
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-school-primary/10">
          <ShieldCheck className="h-6 w-6 text-school-primary" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Create Admin Account
        </h1>
        <p className="mt-2 text-sm text-slate">
          Set up your platform administrator credentials
        </p>
      </div>

      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-5">
        {signupForm.formState.errors.root && (
          <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
            {signupForm.formState.errors.root.message}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-onyx mb-1.5">
            Full name
          </label>
          <input
            {...signupForm.register('name')}
            type="text"
            id="name"
            autoComplete="name"
            className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
            placeholder="Your full name"
          />
          {signupForm.formState.errors.name && (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {signupForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-onyx mb-1.5">
            Email address
          </label>
          <input
            {...signupForm.register('email')}
            type="email"
            id="email"
            autoComplete="email"
            className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
            placeholder="admin@acadowl.com"
          />
          {signupForm.formState.errors.email && (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {signupForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-onyx mb-1.5">
            Password
          </label>
          <input
            {...signupForm.register('password')}
            type="password"
            id="signup-password"
            autoComplete="new-password"
            className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
            placeholder="Minimum 8 characters"
          />
          {signupForm.formState.errors.password && (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {signupForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-onyx mb-1.5">
            Confirm password
          </label>
          <input
            {...signupForm.register('confirmPassword')}
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
            placeholder="Re-enter your password"
          />
          {signupForm.formState.errors.confirmPassword && (
            <p role="alert" className="mt-1.5 text-xs text-error">
              {signupForm.formState.errors.confirmPassword.message}
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
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
