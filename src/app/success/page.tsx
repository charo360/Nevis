"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') || null;
  const [summary, setSummary] = useState<{ planId?: string; amount?: number; currency?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsProcessed, setCreditsProcessed] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);

    const fetchSessionDetails = async () => {
      try {
        // First, get session details
        const response = await fetch('/api/payments/session-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setSummary({
            planId: data.planId,
            amount: (data.amountCents || 0) / 100,
            currency: data.currency
          });

          // Credits are processed automatically via Stripe webhooks in production
          // No manual processing needed - webhooks handle credit addition
          setCreditsProcessed(true);
          console.log('✅ Payment successful - credits will be added via webhook');
        } else {
          setError(data.error || 'Failed to fetch payment details');
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Failed to fetch payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Success page is unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">No session ID found in the URL.</p>
            <Link href="/pricing" className="w-full block">
              <Button className="w-full">Return to Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</CardTitle>
          <p className="text-gray-600 text-lg">
            Thank you for your purchase. Your credits will be added to your account within a few moments.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm text-gray-600">Loading payment details…</p>
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-700 font-medium">Your payment was processed successfully!</p>
                
                {summary && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900 mb-3">Purchase Details</h3>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium text-gray-900">{summary.planId?.toUpperCase() || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">
                        {summary.amount ? `${summary.currency?.toUpperCase() || 'USD'} ${summary.amount.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {/* <div className="text-xs text-gray-500 space-y-1">
                  <p>Session ID:</p>
                  <div className="break-all text-xs font-mono bg-gray-100 p-2 rounded text-gray-700">
                    {sessionId}
                  </div>
                </div> */}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link href="/pricing" className="flex-1">
              <Button variant="outline" className="w-full">View Pricing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}