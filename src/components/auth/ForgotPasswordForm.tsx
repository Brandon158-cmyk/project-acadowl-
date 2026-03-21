"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Validation ────────────────────────────────────────────────────────────

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Success state ─────────────────────────────────────────────────────────

function SubmittedState({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Success indicator */}
      <Alert className="bg-success-bg border-success-border text-(--success) px-4 py-3.5">
        <CheckCircle2 size={15} className="mt-px shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-medium">Reset link sent</p>
          <AlertDescription className="text-[12px] text-(--success)/80 leading-snug">
            If an account exists for <span className="font-bold">{email}</span>, you will receive reset instructions
            within a few minutes.
          </AlertDescription>
        </div>
      </Alert>

      {/* Instructions */}
      <div className="flex flex-col gap-2">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          Check your spam folder if the email does not arrive. The reset link expires after{" "}
          <span className="font-medium text-text-primary">1 hour</span>.
        </p>
      </div>

      {/* Resend */}
      <div className="pt-1">
        <p className="text-[12px] text-text-secondary">
          Did not receive it?{" "}
          <button
            type="button"
            onClick={onResend}
            className="text-accent-text font-semibold hover:underline transition-colors duration-150"
          >
            Send again
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ForgotPasswordForm() {
  const supabase = createSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const emailValue = form.watch("email");
  const isEmailValid = EMAIL_REGEX.test(emailValue);
  const emailError = form.formState.errors.email;
  const rootError = form.formState.errors.root;
  const isTouched = form.formState.touchedFields;

  const onSubmit = useCallback(
    async (data: ForgotFormData) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          form.setError("root", {
            message: "We could not process your request. Please try again.",
          });
          return;
        }

        setSubmittedEmail(data.email);
      } catch {
        form.setError("root", {
          message: "Something went wrong. Please try again shortly.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [form, supabase]
  );

  if (submittedEmail) {
    return <SubmittedState email={submittedEmail} onResend={() => setSubmittedEmail(null)} />;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Root error */}
      {rootError && (
        <Alert variant="destructive" className="bg-error-bg border-error-border text-(--error) px-3.5 py-3">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
          <AlertDescription className="text-[13px] leading-snug">{rootError.message}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-email" className="text-text-secondary">
          Email address
        </Label>
        <div className="relative group">
          <Input
            {...form.register("email")}
            type="email"
            id="reset-email"
            autoComplete="email"
            aria-describedby={emailError ? "reset-email-error" : undefined}
            aria-invalid={!!emailError}
            placeholder="you@school.edu.zm"
            className={cn("pr-9 min-h-9", emailError && "border-error-border bg-error-bg/50")}
          />

          {/* Animated valid check */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
              isEmailValid && !emailError ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
          >
            <CheckCircle2 size={15} className="text-(--success)" />
          </span>

          {/* Error icon after touch */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
              emailError && isTouched.email ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
          >
            <AlertCircle size={15} className="text-(--error)" />
          </span>
        </div>

        {emailError && (
          <p id="reset-email-error" role="alert" className="text-[11px] font-medium text-(--error)">
            {emailError.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-1 w-full min-h-9 font-semibold tracking-wide flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Mail size={14} aria-hidden="true" />
            Send reset link
          </>
        )}
      </Button>
    </form>
  );
}
