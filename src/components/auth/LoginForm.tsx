"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Validation ────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function waitForSession() {
  const supabase = createSupabaseBrowserClient();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  platform_admin: "/schools",
  teacher: "/my-classes",
  class_teacher: "/my-classes",
  guardian: "/home",
  student: "/portal",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  // Real-time email validity for the animated inline indicator
  const emailValue = form.watch("email");
  const isEmailValid = EMAIL_REGEX.test(emailValue);

  // ── Submit ────────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          form.setError("root", {
            message:
              "Incorrect email or password. Please check your credentials and try again.",
          });
          return;
        }

        const session = await waitForSession();
        if (!session) {
          form.setError("root", {
            message:
              "Your session was created but profile sync is still starting. Please try again in a moment.",
          });
          return;
        }

        let user = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            user = await resolveProfile();
            break;
          } catch (resolveError) {
            if (
              !(resolveError instanceof Error) ||
              !resolveError.message.includes("UNAUTHENTICATED")
            ) {
              throw resolveError;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }

        if (!user) {
          form.setError("root", {
            message:
              "Signed in successfully, but your profile could not be loaded. Please retry once.",
          });
          return;
        }

        if (user.isFirstLogin) {
          router.push("/reset-password");
        } else {
          const role = user.role as string | undefined;
          router.push(
            role ? (ROLE_DASHBOARDS[role] ?? "/dashboard") : "/dashboard",
          );
        }

        router.refresh();
      } catch {
        form.setError("root", {
          message: "Something went wrong. Please try again shortly.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [form, router, supabase, resolveProfile],
  );

  // ── Derived state ─────────────────────────────────────────────────────

  const emailError = form.formState.errors.email;
  const passwordError = form.formState.errors.password;
  const rootError = form.formState.errors.root;
  const isTouched = form.formState.touchedFields;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {/* ── Root / server error ── */}
      {rootError && (
        <Alert
          variant="destructive"
          className="bg-error-bg border-error-border text-(--error)"
        >
          <AlertCircle className="size-4" />
          <AlertDescription>{rootError.message}</AlertDescription>
        </Alert>
      )}

      {/* ── Email ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-text-secondary">
          Email address
        </Label>

        <div className="relative group">
          <Input
            {...form.register("email")}
            type="email"
            id="email"
            autoComplete="email"
            aria-describedby={emailError ? "email-error" : undefined}
            aria-invalid={!!emailError}
            placeholder="you@school.edu.zm"
            className={cn(
              "pr-9 min-h-9",
              emailError && "border-error-border bg-error-bg/50",
            )}
          />

          {/*
           * Animated inline check — fades + scales in when the email is
           */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
              isEmailValid && !emailError
                ? "opacity-100 scale-100"
                : "opacity-0 scale-75 pointer-events-none",
            )}
          >
            <CheckCircle2 size={15} className="text-(--success)" />
          </span>

          {/* Error icon — appears only after the field has been touched */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
              emailError && isTouched.email
                ? "opacity-100 scale-100"
                : "opacity-0 scale-75 pointer-events-none",
            )}
          >
            <AlertCircle size={15} className="text-(--error)" />
          </span>
        </div>

        {emailError && (
          <p
            id="email-error"
            role="alert"
            className="text-[11px] font-medium text-(--error)"
          >
            {emailError.message}
          </p>
        )}
      </div>

      {/* ── Password ── */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          title="Password"
          className="text-text-secondary"
        >
          Password
        </Label>

        <div className="relative group">
          <Input
            {...form.register("password")}
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            aria-describedby={passwordError ? "password-error" : undefined}
            aria-invalid={!!passwordError}
            placeholder="••••••••"
            className={cn(
              "pr-10 min-h-9",
              passwordError && "border-error-border bg-error-bg/50",
            )}
          />

          {/* Eye toggle — show/hide password */}
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 rounded-sm"
          >
            {showPassword ? (
              <EyeOff size={15} aria-hidden="true" />
            ) : (
              <Eye size={15} aria-hidden="true" />
            )}
          </button>
        </div>

        {passwordError && (
          <p
            id="password-error"
            role="alert"
            className="text-[11px] font-medium text-(--error)"
          >
            {passwordError.message}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-1 w-full min-h-9 font-semibold tracking-wide"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
