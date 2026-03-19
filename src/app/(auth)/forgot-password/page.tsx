import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-slate">
          Enter your email and we&apos;ll send a reset code to your registered phone
        </p>
      </div>

      <ForgotPasswordForm />

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
