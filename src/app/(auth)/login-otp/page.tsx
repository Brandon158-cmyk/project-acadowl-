import Link from "next/link";
import { OtpForm } from "@/components/auth/OtpForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

/**
 * The right panel copy is the same for both the phone entry and OTP verify
 * steps — the form handles step state internally. The panel simply sets
 * the security context once and stays consistent.
 */
function OtpPanelFooter() {
  return (
    <p className="text-[12px] text-text-tertiary leading-relaxed">
      Only Zambian numbers registered with the school are permitted to sign in
      via SMS. Contact your administrator if your number has changed.
    </p>
  );
}

export default function LoginOtpPage() {
  return (
    <AuthLayout
      panelHeading="Verification codes are single-use and expire after 10 minutes."
      panelBody="Never share your code with anyone, including IT staff. Acadowl will never ask for your verification code directly."
      panelFooter={<OtpPanelFooter />}
    >
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text-primary tracking-[-0.02em] leading-tight">
          Sign in with phone
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Enter your registered number and we will send a one-time code.
        </p>
      </div>

      <OtpForm />

      {/* Footer link */}
      <div className="mt-5 pt-4 border-t border-border-inner text-center">
        <Link
          href="/login"
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Sign in with email instead
        </Link>
      </div>
    </AuthLayout>
  );
}
