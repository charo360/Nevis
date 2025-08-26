"use client";

import React from 'react'
import VerifyEmail from '@/components/auth/VerifyEmail'

export default function VerifyEmailPage() {
  // This page expects to receive ?email=... and optionally ?type=signup
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const email = params.get('email') || ''
  return <div className="min-h-screen flex items-center justify-center p-6"><VerifyEmail email={email} onSuccess={() => window.location.href = '/'} /></div>
}
