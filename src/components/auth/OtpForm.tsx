'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { normalizeZambianPhone } from '@/lib/utils/normalizePhone';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';

export function OtpForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const resolveProfile = useMutation(api.users.mutations.resolveUserProfile);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP input when switching to verify step
  useEffect(() => {
    if (step === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const normalizedPhone = normalizeZambianPhone(phone);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      sessionStorage.setItem('otp_phone', normalizedPhone);
      setStep('verify');
      startCountdown();
    } catch {
      setError('We couldn\u2019t send the code. Check your number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const storedPhone = sessionStorage.getItem('otp_phone');
    if (!storedPhone) {
      router.push('/login-otp');
      return;
    }

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: storedPhone,
        token: otpCode,
        type: 'sms',
      });

      if (verifyError) {
        setError('Invalid or expired code. Please try again.');
        return;
      }

      const user = await resolveProfile();
      sessionStorage.removeItem('otp_phone');
      if (user?.isFirstLogin) {
        router.push('/reset-password');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    const storedPhone = sessionStorage.getItem('otp_phone');
    if (!storedPhone) {
      router.push('/login-otp');
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
      startCountdown();
    } catch {
      setError('We couldn\u2019t resend the code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={sendOtp} className="space-y-5">
        {error && (
          <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-onyx mb-1.5">
            Phone number
          </label>
          <input
            type="tel"
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
            placeholder="0971 234 567"
          />
          <p className="mt-1.5 text-xs text-slate">Enter your Zambian phone number</p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !phone}
          className="inline-flex w-full items-center justify-center h-11 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            'Send OTP'
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="space-y-5">
      {error && (
        <div role="alert" className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-onyx mb-1.5">
          Enter OTP code
        </label>
        <input
          ref={otpInputRef}
          type="text"
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          className="block w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-center text-lg tracking-widest text-onyx placeholder:text-slate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:border-school-primary"
          placeholder="123456"
        />
        <p className="mt-1.5 text-xs text-slate">
          Enter the 6-digit code sent to your phone
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || otpCode.length !== 6}
        className="inline-flex w-full items-center justify-center h-11 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Verifying...
          </>
        ) : (
          'Verify'
        )}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="text-sm text-slate hover:text-onyx transition-colors duration-200"
        >
          Change number
        </button>
        <button
          type="button"
          onClick={resendOtp}
          disabled={countdown > 0 || isLoading}
          className="text-sm text-school-primary hover:text-crimson-dark disabled:text-gray-400 transition-colors duration-200"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
}
