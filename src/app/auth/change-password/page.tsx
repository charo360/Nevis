"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const email = localStorage.getItem('reset_email')
    const verified = localStorage.getItem('reset_code_verified')
    if (!email || verified !== 'true') {
      router.push('/auth/forgot-password')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      const email = localStorage.getItem('reset_email')
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, newPassword: form.newPassword }) })
      const body = await res.json()
      if (res.ok && body.ok) {
        localStorage.removeItem('reset_email')
        localStorage.removeItem('reset_code_verified')
        toast({ title: 'Password changed', description: 'Please login with your new password.' })
        router.push('/auth/login')
      } else {
        const msg = body.error || 'Failed to change password'
        toast({ variant: 'destructive', title: 'Error', description: msg })
        try {
          // Try to show a friendly modal if SweetAlert2 is available
          ;(await import('sweetalert2')).default.fire({ icon: 'error', title: 'Error', text: msg })
        } catch (_) {
          // ignore if not installed
        }
      }
    } catch (err) {
      alert('Failed to change password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-BP-lightbaige py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-2">Create New Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" placeholder="New password" value={form.newPassword} onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))} className="w-full px-4 py-2 border rounded" required />
            <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))} className="w-full px-4 py-2 border rounded" required />
            <button disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded">{loading ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
