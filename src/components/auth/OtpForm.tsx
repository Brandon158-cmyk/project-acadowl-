"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ClipboardEvent,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Phone, ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizeZambianPhone } from "@/lib/utils/normalizePhone";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;

const ROLE_DASHBOARDS: Record<string, string> = {
  platform_admin: "/schools",
  teacher: "/my-classes",
  class_teacher: "/my-classes",
  guardian: "/home",
  student: "/portal",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

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

/**
 * Format a raw digit string as a Zambian phone number for display.
 * e.g. "0971234567" → "0971 234 567"
 */
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

// ─── Shared UI primitives ──────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      className="bg-error-bg border-error-border text-(--error) px-3.5 py-3"
    >
      <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
      <AlertDescription className="text-[13px] leading-snug">
        {message}
      </AlertDescription>
    </Alert>
  );
}

// ─── Step 1: Phone entry ───────────────────────────────────────────────────

interface PhoneStepProps {
  onSent: (normalizedPhone: string) => void;
}

function PhoneStep({ onSent }: PhoneStepProps) {
  const supabase = createSupabaseBrowserClient();
  const [rawPhone, setRawPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, spaces, +, and hyphens while typing
    const sanitized = e.target.value.replace(/[^\d\s+\-()]/g, "");
    setRawPhone(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digitsOnly = rawPhone.replace(/\D/g, "");
    if (digitsOnly.length < 9) {
      setError("Enter a valid Zambian phone number (e.g. 0971 234 567).");
      return;
    }

    setIsLoading(true);
    try {
      const normalized = normalizeZambianPhone(rawPhone);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      sessionStorage.setItem("otp_phone", normalized);
      onSent(normalized);
    } catch {
      setError(
        "We couldn\u2019t send the code. Check your number and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayValue = formatPhoneDisplay(rawPhone.replace(/\D/g, ""));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-text-secondary">
          Phone number
        </Label>

        {/* Input with flag prefix */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 bg-surface-subtle border border-border-panel rounded-md shrink-0 h-9">
            <span className="text-[13px]" role="img" aria-label="Zambia">
              🇿🇲
            </span>
            <span className="text-[13px] text-text-secondary font-medium">
              +260
            </span>
          </div>
          <Input
            type="tel"
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            value={displayValue}
            onChange={handleChange}
            placeholder="0971 234 567"
            className="flex-1 min-h-9"
          />
        </div>

        <p className="text-[11px] text-text-tertiary mt-0.5">
          Enter your registered Zambian phone number
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || rawPhone.replace(/\D/g, "").length < 9}
        className="mt-1 w-full min-h-9 font-semibold tracking-wide flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Sending code…
          </>
        ) : (
          <>
            <Phone size={14} aria-hidden="true" />
            Send verification code
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Step 2: 6-digit OTP boxes ─────────────────────────────────────────────

interface VerifyStepProps {
  phone: string;
  onBack: () => void;
}

function VerifyStep({ phone, onBack }: VerifyStepProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start countdown on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // Focus first box
    inputRefs.current[0]?.focus();
    return () => clearInterval(timer);
  }, []);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH && digits.every(Boolean);

  // ── Digit input handling ──────────────────────────────────────────────

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current box
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Move to previous box and clear it
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle paste — fills all boxes from the first box regardless of where
   * the user pastes, as long as the pasted string is 6 digits.
   */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    setError(null);

    // Focus the box after the last pasted digit (or the last box)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    setIsLoading(true);
    setError(null);

    const storedPhone = sessionStorage.getItem("otp_phone");
    if (!storedPhone) {
      router.push("/login-otp");
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: storedPhone,
        token: code,
        type: "sms",
      });

      if (verifyError) {
        setError(
          "Invalid or expired code. Please try again or request a new one.",
        );
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      const session = await waitForSession();
      if (!session) {
        setError(
          "Session created but profile sync is still starting. Please verify again in a moment.",
        );
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
        setError(
          "Signed in, but your profile could not be loaded. Please retry once.",
        );
        return;
      }

      sessionStorage.removeItem("otp_phone");
      router.push(
        user.isFirstLogin
          ? "/reset-password"
          : user.role
            ? (ROLE_DASHBOARDS[user.role as string] ?? "/dashboard")
            : "/dashboard",
      );
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again shortly.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    const storedPhone = sessionStorage.getItem("otp_phone");
    if (!storedPhone) {
      router.push("/login-otp");
      return;
    }

    setIsLoading(true);
    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        phone: storedPhone,
      });
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch {
      setError("We couldn\u2019t resend the code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [countdown, router, supabase]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}

      {/* Sent-to confirmation */}
      <div className="flex items-center gap-2 rounded-md bg-surface-subtle border border-border-panel px-3.5 py-2.5">
        <Phone
          size={13}
          className="text-text-tertiary shrink-0"
          aria-hidden="true"
        />
        <p className="text-[12px] text-text-secondary">
          Code sent to{" "}
          <span className="font-medium text-text-primary font-mono">
            {phone}
          </span>
        </p>
      </div>

      {/* 6-box OTP input */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-text-secondary">Verification code</Label>

        <div
          className="flex gap-2"
          role="group"
          aria-label="6-digit verification code"
        >
          {digits.map((digit, index) => (
            <Input
              key={index}
              ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={cn(
                "flex-1 min-w-0 h-11 text-center font-bold text-lg p-0",
                digit
                  ? "border-accent bg-accent-bg text-accent"
                  : error
                    ? "border-error-border"
                    : "",
              )}
            />
          ))}
        </div>

        <p className="text-[11px] text-text-tertiary">
          The code expires in 10 minutes.
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading || !isComplete}
        className="mt-1 w-full min-h-9 font-semibold tracking-wide flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Verifying…
          </>
        ) : (
          <>
            <ArrowRight size={14} aria-hidden="true" />
            Verify and continue
          </>
        )}
      </Button>

      {/* Resend + change number */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Change number
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isLoading}
          className={cn(
            "text-[13px] font-medium transition-colors duration-150",
            countdown > 0
              ? "text-text-tertiary cursor-default"
              : "text-accent-text hover:underline",
          )}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────

export function OtpForm() {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [sentToPhone, setSentToPhone] = useState("");

  const handleSent = (normalizedPhone: string) => {
    setSentToPhone(normalizedPhone);
    setStep("verify");
  };

  const handleBack = () => {
    setSentToPhone("");
    setStep("phone");
  };

  if (step === "verify") {
    return <VerifyStep phone={sentToPhone} onBack={handleBack} />;
  }

  return <PhoneStep onSent={handleSent} />;
}
