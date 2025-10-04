"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</CardTitle>
          <p className="text-gray-600 text-lg">Your payment was cancelled. No charges were made.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-700">If you changed your mind, you can try again or return to the pricing page to choose a different plan.</p>
          </div>

          <div className="flex gap-4 pt-4">
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
