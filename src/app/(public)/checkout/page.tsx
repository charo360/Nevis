'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Check } from 'lucide-react';
import { getPlanById } from '@/lib/pricing-data';
import { RevoCreditCosts } from '@/components/pricing/RevoCreditCosts';
import Link from 'next/link';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const userId = searchParams.get('user');
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (planId) {
      const selectedPlan = getPlanById(planId);
      setPlan(selectedPlan);
    }
  }, [planId]);

  const handlePayment = async () => {
    setLoading(true);
    
    // TODO: Integrate with Stripe or payment processor
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Process actual payment
      alert('Payment simulation - In production, this would process the payment');
      
      // Redirect to success page
      window.location.href = '/success';
      
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Invalid plan selected</p>
              <Link href="/pricing" className="mt-4 inline-block">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pricing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="text-gray-600 mt-2">Secure checkout powered by Stripe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  {plan.popular && (
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{plan.credits}</div>
                    <div className="text-sm text-gray-500">credits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">${plan.price}</div>
                    <div className="text-sm text-gray-500">one-time</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Cost per credit: ${plan.costPerCredit.toFixed(3)}
                </div>
              </div>

              {/* Credit Usage Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <RevoCreditCosts compact={true} showTitle={true} />
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold mb-3">What's included:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bonuses */}
              {plan.bonuses && plan.bonuses.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Bonus Features:</h4>
                  <ul className="space-y-1">
                    {plan.bonuses.map((bonus: string, index: number) => (
                      <li key={index} className="flex items-start text-sm text-blue-700">
                        <Check className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${plan.price}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">One-time payment • Credits never expire</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Your payment information is secure and encrypted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method */}
              <div>
                <h4 className="font-semibold mb-3">Payment Method</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Stripe Payment Integration</p>
                      <p className="text-sm text-gray-500">
                        In production, this would show the Stripe payment form
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Secure Payment</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    256-bit SSL encryption
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    PCI DSS compliant
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    7-day money-back guarantee
                  </li>
                </ul>
              </div>

              {/* Payment Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay $${plan.price} • Get ${plan.credits} Credits`}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Credits will be added to your account immediately after payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
