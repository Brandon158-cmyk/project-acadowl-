import Link from "next/link";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginPanelFooter() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[22px] font-bold text-white leading-none tracking-tight">
          1,284
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-text-secondary">
          Students enrolled this year
        </p>
      </div>

      <div className="h-px bg-border-inner" />

      <div>
        <p className="text-[22px] font-bold text-white leading-none tracking-tight">
          87.4%
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-text-secondary">
          Average attendance this term
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      panelHeading="School management built for institutions that demand clarity."
      panelBody="A unified platform for administration, academics, and student life. Sign in to access your portal."
      panelFooter={<LoginPanelFooter />}
    >
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-text-primary tracking-[-0.02em] leading-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Sign in to your institutional portal to continue.
        </p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer links */}
      <div className="mt-5 pt-4 border-t border-border-inner flex flex-col gap-2 text-center">
        <Link
          href="/forgot-password"
          className="text-[13px] text-accent-text font-medium hover:underline transition-colors duration-150"
        >
          Forgot password?
        </Link>
        <Link
          href="/login-otp"
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Sign in with phone number instead
        </Link>
      </div>
    </AuthLayout>
  );
}
