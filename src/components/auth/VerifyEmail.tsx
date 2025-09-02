"use client";

import React, { useRef, useState, useEffect } from 'react';

type VerifyEmailProps = {
  email: string;
  onSuccess: () => void;
  onClose?: () => void;
  type?: 'signup' | 'reset' | string;
};

export default function VerifyEmail({ email, onSuccess, onClose, type = 'signup' }: VerifyEmailProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Focus first input on open
    const first = document.querySelector<HTMLInputElement>('input[name="code-0"]');
    first?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(0, 1);
    setCode(newCode);

    if (value && index < 4) {
      const next = document.querySelector<HTMLInputElement>(`input[name="code-${index + 1}"]`);
      next?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = document.querySelector<HTMLInputElement>(`input[name="code-${index - 1}"]`);
      if (prev) {
        prev.focus();
        const updated = [...code];
        updated[index - 1] = '';
        setCode(updated);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('Text').trim();
    if (/^\d{5}$/.test(text)) {
      setCode(text.split(''));
      const last = document.querySelector<HTMLInputElement>('input[name="code-4"]');
      last?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 5) {
      alert('Enter 5-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode, type }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        onSuccess();
        onClose?.();
      } else {
        alert(body?.error || 'Invalid code');
        setCode(['', '', '', '', '']);
      }
    } catch (err) {
      alert('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || countdown > 0) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setCode(['', '', '', '', '']);
        setCountdown(30);
      } else {
        alert(body?.error || 'Failed to resend code');
      }
    } catch (err) {
      alert('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        // Fix: only close when clicking the backdrop itself (target equals the element with the handler)
        // use currentTarget for a robust comparison
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-md w-full relative animate-fadeIn border border-gray-700 shadow-2xl">
        <button
          type="button"
          onClick={() => onClose?.()}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-xl">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">
            {type === 'reset' ? 'Verify Reset Code' : 'Verify Email'}
          </h2>

          <div className="space-y-2">
            <p className="text-gray-300">Please enter the verification code sent to</p>
            <p className="font-medium text-yellow-400 break-all">{email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    name={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 bg-gray-800 text-white text-center text-xl rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-sm">Haven't received the code? Check your spam folder</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isLoading || code.join('').length !== 5}
                className="flex-1 bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 active:bg-yellow-600 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Verify Code
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0}
                className="text-yellow-400 hover:text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </div>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}