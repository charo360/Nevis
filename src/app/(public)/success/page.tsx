'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti effect after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-4">Purchase Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">150</div>
                <div className="text-sm text-green-700">Credits Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">$29</div>
                <div className="text-sm text-green-700">Amount Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">∞</div>
                <div className="text-sm text-green-700">Never Expire</div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium mb-2">Start Creating</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use your credits to generate stunning AI-powered designs
                </p>
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium mb-2">Learn More</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Discover all the features and AI models available
                </p>
                <Link href="/#features">
                  <Button variant="outline" size="sm" className="w-full">
                    View Features
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Receipt & Support */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div>
                <h4 className="font-medium mb-2">Receipt</h4>
                <p className="text-sm text-gray-600 mb-3">
                  A receipt has been sent to your email
                </p>
                <Button variant="ghost" size="sm">
                  Download Receipt
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Our support team is here to help
                </p>
                <Button variant="ghost" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
            <Link href="/auth" className="flex-1">
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
