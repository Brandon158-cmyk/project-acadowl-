"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Validation ────────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Must include at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

const ROLE_DASHBOARDS: Record<string, string> = {
  platform_admin: "/schools",
  teacher: "/my-classes",
  class_teacher: "/my-classes",
  guardian: "/home",
  student: "/portal",
};

// ─── Password strength ─────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  level: StrengthLevel;
  label: string;
  /** Tailwind bg class for filled segments */
  segmentClass: string;
}

function getStrength(password: string): StrengthResult {
  if (!password) return { level: 0, label: "", segmentClass: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  // cap at 4
  const level = Math.min(score, 4) as StrengthLevel;

  const map: Record<StrengthLevel, Omit<StrengthResult, "level">> = {
    0: { label: "", segmentClass: "" },
    1: { label: "Weak", segmentClass: "bg-(--error)" },
    2: { label: "Fair", segmentClass: "bg-(--warning)" },
    3: { label: "Good", segmentClass: "bg-(--success)" },
    4: { label: "Strong", segmentClass: "bg-(--success)" },
  };

  return { level, ...map[level] };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ForceResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const completeFirstLogin = useMutation(api.users.mutations.completeFirstLogin);
  const me = useQuery(api.users.queries.me);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const passwordValue = form.watch("password");
  const confirmValue = form.watch("confirmPassword");
  const strength = useMemo(() => getStrength(passwordValue), [passwordValue]);

  // Derived: confirm field match state (only show after user has typed something)
  const confirmTouched = form.formState.touchedFields.confirmPassword;
  const passwordsMatch = confirmValue.length > 0 && passwordValue === confirmValue;
  const confirmMismatch = confirmTouched && confirmValue.length > 0 && passwordValue !== confirmValue;

  const onSubmit = useCallback(
    async (data: ResetFormData) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (error) {
          form.setError("root", { message: error.message });
          return;
        }

        await completeFirstLogin();

        const role = me?.role as string | undefined;
        router.push(role ? (ROLE_DASHBOARDS[role] ?? "/dashboard") : "/dashboard");
        router.refresh();
      } catch {
        form.setError("root", {
          message: "Something went wrong. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [form, supabase, completeFirstLogin, me, router]
  );

  const rootError = form.formState.errors.root;
  const passwordError = form.formState.errors.password;
  const confirmError = form.formState.errors.confirmPassword;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Root error */}
      {rootError && (
        <Alert variant="destructive" className="bg-error-bg border-error-border text-(--error)">
          <AlertCircle className="size-4" />
          <AlertDescription>{rootError.message}</AlertDescription>
        </Alert>
      )}

      {/* ── New password ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" title="Password" className="text-text-secondary">
          New password
        </Label>

        <div className="relative group">
          <Input
            {...form.register("password")}
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="new-password"
            aria-describedby={passwordError ? "password-error" : "password-strength"}
            aria-invalid={!!passwordError}
            placeholder="Minimum 8 characters"
            className={cn("pr-10 min-h-9", passwordError && "border-error-border bg-error-bg/50")}
          />

          {/* Eye toggle */}
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 rounded-sm"
          >
            {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        </div>

        {/* Strength meter — only shown when the field has content */}
        {passwordValue.length > 0 && (
          <div id="password-strength" aria-live="polite">
            <div className="flex gap-1 mt-1.5">
              {([1, 2, 3, 4] as StrengthLevel[]).map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    "h-[3px] flex-1 rounded-full transition-all duration-300",
                    seg <= strength.level ? strength.segmentClass : "bg-border-inner"
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <p className="mt-1 text-[11px] text-text-tertiary">
                Strength:{" "}
                <span
                  className={cn(
                    "font-medium",
                    strength.level <= 1 ? "text-(--error)" : strength.level === 2 ? "text-(--warning)" : "text-(--success)"
                  )}
                >
                  {strength.label}
                </span>
              </p>
            )}
          </div>
        )}

        {passwordError && (
          <p id="password-error" role="alert" className="text-[11px] font-medium text-(--error)">
            {passwordError.message}
          </p>
        )}
      </div>

      {/* ── Confirm password ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" title="Confirm Password" className="text-text-secondary">
          Confirm new password
        </Label>

        <div className="relative group">
          <Input
            {...form.register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            id="confirmPassword"
            autoComplete="new-password"
            aria-describedby={confirmError ? "confirm-error" : undefined}
            aria-invalid={!!confirmError}
            placeholder="Re-enter your new password"
            className={cn(
              "pr-10 min-h-9",
              confirmError || confirmMismatch
                ? "border-error-border bg-error-bg/50"
                : passwordsMatch
                  ? "border-success-border bg-success-bg/30"
                  : ""
            )}
          />

          {/* Match indicator — green check */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none",
              passwordsMatch ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          >
            <CheckCircle2 size={15} className="text-(--success)" />
          </span>

          {/* Mismatch indicator — red alert */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-none",
              confirmMismatch && !passwordsMatch ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          >
            <AlertCircle size={15} className="text-(--error)" />
          </span>

          {/* Eye toggle — visible when neither match nor mismatch is showing */}
          <button
            type="button"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-text-tertiary hover:text-text-secondary",
              "transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 rounded-sm",
              passwordsMatch || confirmMismatch ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            {showConfirm ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        </div>

        {(confirmError || confirmMismatch) && (
          <p id="confirm-error" role="alert" className="text-[11px] font-medium text-(--error)">
            {confirmError?.message ?? "Passwords do not match"}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="mt-1 w-full min-h-9 font-semibold tracking-wide">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}
