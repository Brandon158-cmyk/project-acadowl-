import { AuthLayout } from '@/components/layout/AuthLayout';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-slate">
          Enter your new password below
        </p>
      </div>

      {/* ResetPasswordForm will be built when Supabase password reset flow is wired */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-slate text-center">
          Password reset form will be implemented with Supabase auth flow.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/login"
          className="text-sm text-slate hover:text-onyx transition-colors duration-200"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
