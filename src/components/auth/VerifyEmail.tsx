"use client";

import React, { useState } from 'react'

export default function VerifyEmail({ email, onSuccess, type = 'signup' }: { email: string; onSuccess: () => void; type?: string }) {
  const [code, setCode] = useState(['', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    const codeStr = code.join('')
    if (codeStr.length !== 5) return alert('Enter 5-digit code')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: codeStr, type }) })
      const body = await res.json()
      if (res.ok && body.ok) onSuccess()
      else alert(body.error || 'Invalid code')
    } catch (err) { console.error(err); alert('Failed to verify') } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resending) return
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type }) })
      const body = await res.json()
      if (res.ok && body.ok) alert('Code resent')
      else alert(body.error || 'Failed to resend')
    } catch (err) { console.error(err); alert('Failed to resend') } finally { setResending(false) }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl p-6 shadow">
      <h3 className="text-lg font-semibold">Verify your email</h3>
      <p className="text-sm text-gray-600">We sent a 5-digit code to {email}</p>

      <div className="flex gap-2 mt-4">
        {code.map((d, i) => (
          <input key={i} className="w-12 h-12 text-center border rounded" value={d} onChange={(e) => { if (/^\d*$/.test(e.target.value)) { const next = [...code]; next[i] = e.target.value.slice(0,1); setCode(next) } }} />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handleVerify} className="flex-1 bg-yellow-500 py-2 rounded text-black">{loading ? 'Verifying...' : 'Verify'}</button>
        <button onClick={handleResend} className="px-4 py-2 border rounded">{resending ? 'Sending...' : 'Resend'}</button>
      </div>
    </div>
  )
}
