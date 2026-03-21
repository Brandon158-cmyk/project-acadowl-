import { AuthLayout } from "@/components/layout/AuthLayout";
import { ForceResetPasswordForm } from "@/components/auth/ForceResetPasswordForm";

function ResetPanelFooter() {
  const requirements = [
    "8 or more characters",
    "At least one number",
    "One special character (!@#$…)",
    "Upper and lowercase letters",
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.06em]">
        Requirements
      </p>
      <ul className="flex flex-col gap-2">
        {requirements.map((req) => (
          <li key={req} className="flex items-center justify-between">
            <span className="text-[12px] text-text-secondary">{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      panelHeading="Choose a strong password you have not used elsewhere."
      panelBody="Your password is hashed and never stored in plain text. Acadowl staff will never ask you for your password."
      panelFooter={<ResetPanelFooter />}
    >
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 bg-success-bg border border-success-border rounded-[5px] px-2.5 py-1.5 mb-4">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-(--success)"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[12px] font-medium text-(--success)">
            Identity verified
          </span>
        </div>

        <h1 className="text-[20px] font-bold text-text-primary tracking-[-0.02em] leading-tight">
          Set a new password
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          You must set a new password before continuing to your portal.
        </p>
      </div>

      <ForceResetPasswordForm />
    </AuthLayout>
  );
}
