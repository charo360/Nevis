"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [confetti, setConfetti] = useState(true);
  const [recording, setRecording] = useState<'idle' | 'loading' | 'done' | 'failed'>('idle');
  const [summary, setSummary] = useState<{ planId?: string; amount?: number; currency?: string } | null>(null);
  const search = useSearchParams();
  const router = useRouter();
  const { user, getAccessToken } = useAuth();

  const sessionId = search?.get('session_id') || null;

  useEffect(() => {
    // Hide confetti effect after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // First, fetch session summary unauthenticated so page is visible after Stripe redirect.
    const fetchSummary = async () => {
      try {
        const sessionRes = await fetch('/api/payments/session-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const sessionJson = await sessionRes.json();
        if (sessionRes.ok && sessionJson.ok) {
          const { planId, amountCents, currency } = sessionJson;
          const amount = (amountCents || 0) / 100;
          setSummary({ planId, amount, currency });
        } else {
          console.warn('Failed to fetch session summary', sessionJson);
        }
      } catch (e) {
        console.error('Failed to fetch session summary', e);
      }
    };

    void fetchSummary();
  }, [sessionId]);

  // When the user becomes available, record payment (if summary exists)
  useEffect(() => {
    if (!sessionId || !user || !summary) return;

    const record = async () => {
      setRecording('loading');
      try {
        const idToken = await getAccessToken();
        if (!idToken) {
          setRecording('failed');
          return;
        }

        const { planId } = summary;
        const amount = summary.amount || 0;
        const currency = summary.currency || 'usd';

        const recordRes = await fetch('/api/payments/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, sessionId, planId: planId || 'starter', amount, currency })
        });

        const recordJson = await recordRes.json();
        if (recordRes.ok && recordJson.success) {
          setRecording('done');
        } else {
          console.warn('Recording failed', recordJson);
          setRecording('failed');
        }
      } catch (e) {
        console.error('Recording error', e);
        setRecording('failed');
      }
    };

    void record();
  }, [sessionId, user, summary, getAccessToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      {confetti && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Simple confetti effect */}
          <div className="absolute top-1/4 left-1/4 animate-bounce">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-bounce delay-100">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="absolute top-1/2 left-1/3 animate-bounce delay-200">
            <Sparkles className="w-5 h-5 text-green-400" />
          </div>
          <div className="absolute top-2/3 right-1/3 animate-bounce delay-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      )}

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Your credits have been added to your account
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Purchase Summary */}
          <div className="bg-white/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold">Purchase Summary</h4>
            {summary ? (
              <div className="mt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="font-medium">{summary.planId || '—'}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="font-medium">{summary.amount ? `${summary.currency?.toUpperCase() || 'USD'} ${summary.amount.toFixed(2)}` : '—'}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500">Fetching purchase details...</div>
            )}
          </div>

          {/* What's Next */}
          <div>
            <h4 className="text-lg font-semibold">Status</h4>
            <div className="mt-2">
              {recording === 'loading' && <div className="text-sm text-gray-600">Recording payment...</div>}
              {recording === 'done' && <div className="text-sm text-green-600">Payment recorded. Credits added to your account.</div>}
              {recording === 'failed' && <div className="text-sm text-red-600">Failed to record payment. If your card was charged, contact support.</div>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                Start Creating
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Thank You Message */}
          <div className="text-center pt-4 border-t">
            <p className="text-gray-600">
              Thank you for choosing Crevo AI! We're excited to see what you create.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
