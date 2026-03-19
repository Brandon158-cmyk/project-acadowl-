import { OtpForm } from '@/components/auth/OtpForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import Link from 'next/link';


export default function LoginOtpPage() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Sign in with Phone
        </h1>
        <p className="mt-2 text-sm text-slate">
          Enter your phone number to receive an OTP
        </p>
      </div>

      <OtpForm />

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/login"
          className="text-sm text-slate hover:text-onyx transition-colors duration-200"
        >
          Sign in with email instead
        </Link>
      </div>
    </AuthLayout>
  );
}
