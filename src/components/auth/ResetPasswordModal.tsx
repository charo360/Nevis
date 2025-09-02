"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type Props = { email: string; onClose: () => void };

export default function ResetPasswordModal({ email, onClose }: Props) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const { toast } = useToast();

  useEffect(() => void inputsRef.current[0]?.focus(), []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(0, 1);
    setCode(next);
    if (value && index < inputsRef.current.length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length !== 5) return alert('Enter 5-digit code');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr, type: 'reset' }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        localStorage.setItem('reset_email', email);
        localStorage.setItem('reset_code_verified', 'true');
        onClose();
        window.location.href = '/auth/change-password';
      } else {
        const msg = body?.error || 'Invalid code'
        toast({ variant: 'destructive', title: 'Verification failed', description: msg })
        try { (await import('sweetalert2')).default.fire({ icon: 'error', title: 'Verification failed', text: msg }) } catch (_) {}
        setCode(['', '', '', '', '']);
      }
    } catch (err) {
      alert('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset' }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        toast({ title: 'Code resent', description: 'Check your inbox.' })
      } else {
        const msg = body?.error || 'Failed to resend'
        toast({ variant: 'destructive', title: 'Error', description: msg })
        try { (await import('sweetalert2')).default.fire({ icon: 'error', title: 'Error', text: msg }) } catch (_) {}
      }
    } catch (err) {
      alert('Failed to resend');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">Enter verification code</h3>
        <p className="text-sm text-gray-600 mt-2">We sent a 5-digit code to {email}</p>

        <form onSubmit={handleVerify} className="mt-4">
          <div className="flex gap-2 justify-center">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="w-12 h-12 text-center border rounded"
                aria-label={`digit-${i + 1}`}
              />
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 bg-purple-600 text-white py-2 rounded" type="submit">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={handleResend} className="px-4 py-2 border rounded">
              {resendLoading ? 'Sending...' : 'Resend'}
            </button>
          </div>

          <div className="mt-3 text-sm text-gray-500 text-center">
            <button type="button" onClick={onClose} className="underline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
