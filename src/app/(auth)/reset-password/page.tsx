import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForceResetPasswordForm } from '@/components/auth/ForceResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-semibold text-onyx">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-slate">
          You must set a new password before continuing
        </p>
      </div>

      <ForceResetPasswordForm />
    </AuthLayout>
  );
}
