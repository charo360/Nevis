"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ResetPasswordModal from './ResetPasswordModal';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset' }),
      });
      const body = await res.json();
      if (res.ok && body.ok) {
        setShowModal(true);
        toast({ title: 'Verification code sent', description: 'Check your inbox.' })
      } else {
        const msg = body.error || 'Failed to send code'
        toast({ variant: 'destructive', title: 'Error', description: msg })
        try {
          // Fallback to a simple alert if sweetalert2 is not installed
          window.alert(msg)
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-BP-lightbaige py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl p-2 shadow-md">
            <span className="font-bold text-xl text-purple-700">Crevo</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
          <p className="text-center text-sm text-gray-600 mb-6">Enter your email and we'll send a verification code to reset your password.</p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-sm font-medium">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full"
              >
                {loading ? 'Sending...' : 'Send reset code'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <ResetPasswordModal email={email} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
