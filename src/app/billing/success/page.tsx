"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function BillingSuccessPage() {
  const search = useSearchParams();
  const sessionId = search?.get('session_id') || null;
  const [summary, setSummary] = useState<{ planId?: string; amount?: number; currency?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch('/api/payments/session-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        const j = await res.json();
        if (res.ok && j.ok) {
          setSummary({ planId: j.planId, amount: (j.amountCents || 0) / 100, currency: j.currency });
        }
      } catch (e) {
        // ignore — we'll still show session id
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Payment Successful</CardTitle>
          <p className="text-gray-600 text-lg">Thank you — your credits should appear in your account shortly.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            {loading ? (
              <p className="text-sm text-gray-600">Loading payment details…</p>
            ) : (
              <>
                <p className="text-sm text-gray-700">Your payment was processed successfully.</p>
                <p className="text-xs text-gray-500 mt-2">Session ID:</p>
                <div className="break-all text-sm font-mono text-gray-700">{sessionId || '—'}</div>
                {summary && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600"><span>Plan</span><span className="font-medium">{summary.planId || '—'}</span></div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1"><span>Amount</span><span className="font-medium">{summary.amount ? `${summary.currency?.toUpperCase() || 'USD'} ${summary.amount.toFixed(2)}` : '—'}</span></div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-4 pt-4 justify-center">
            <Link href="/pricing" className="flex-1">
              <Button variant="outline" className="w-full">View Pricing</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
