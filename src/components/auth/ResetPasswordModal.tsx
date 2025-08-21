"use client";

import React, { useState } from 'react';

export default function ResetPasswordModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(0,1);
    setCode(next);
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join('')
    if (codeStr.length !== 5) return alert('Enter 5-digit code')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr, type: 'reset' }),
      })
      const body = await res.json()
      if (res.ok && body.ok) {
        // Allow change password flow: store email marker
        localStorage.setItem('reset_email', email)
        localStorage.setItem('reset_code_verified', 'true')
        onClose()
        window.location.href = '/auth/change-password'
      } else {
        alert(body.error || 'Invalid code')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to verify code')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendLoading) return
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/resend-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'reset' }) })
      const body = await res.json()
      if (res.ok && body.ok) alert('Code resent')
      else alert(body.error || 'Failed to resend')
    } catch (err) { console.error(err); alert('Failed to resend') } finally { setResendLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold">Enter verification code</h3>
        <p className="text-sm text-gray-600 mt-2">We sent a 5-digit code to {email}</p>

        <form onSubmit={handleVerify} className="mt-4">
          <div className="flex gap-2 justify-center">
            {code.map((d, i) => (
              <input key={i} value={d} onChange={(e) => handleChange(i, e.target.value)} className="w-12 h-12 text-center border rounded" />
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 bg-purple-600 text-white py-2 rounded" type="submit">{loading ? 'Verifying...' : 'Verify'}</button>
            <button type="button" onClick={handleResend} className="px-4 py-2 border rounded">{resendLoading ? 'Sending...' : 'Resend'}</button>
          </div>

          <div className="mt-3 text-sm text-gray-500 text-center">
            <button type="button" onClick={onClose} className="underline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
