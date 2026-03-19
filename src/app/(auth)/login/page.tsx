import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Sign In
        </h1>
        <p className="mt-2 text-sm text-slate">
          Enter your credentials to access your portal
        </p>
      </div>

      <LoginForm />

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-col gap-2 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-school-primary hover:text-crimson-dark transition-colors duration-200"
          >
            Forgot password?
          </Link>
          <Link
            href="/login-otp"
            className="text-sm text-slate hover:text-onyx transition-colors duration-200"
          >
            Sign in with phone number instead
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
