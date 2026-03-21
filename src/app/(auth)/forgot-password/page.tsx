import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

function ForgotPanelFooter() {
  return (
    <p className="text-[12px] text-text-tertiary leading-relaxed">
      For manual account recovery, contact your school&apos;s IT administrator
      directly.
    </p>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      panelHeading="Access recovery is available to all registered staff and students."
      panelBody="A reset link will be sent to your registered institutional email address. If you do not receive it within a few minutes, check your spam folder."
      panelFooter={<ForgotPanelFooter />}
    >
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to sign in
        </Link>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text-primary tracking-[-0.02em] leading-tight">
          Reset your password
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Enter your institutional email and we will send you a reset link.
        </p>
      </div>

      <ForgotPasswordForm />
    </AuthLayout>
  );
}
