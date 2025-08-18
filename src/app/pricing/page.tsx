'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Rocket } from 'lucide-react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { RevoCreditCosts } from '@/components/pricing/RevoCreditCosts';
import { pricingPlans, addOns, pricingFeatures } from '@/lib/pricing-data';
import { initiatePurchase } from '@/app/actions/pricing-actions';

// Icon mapping for dynamic loading
const iconMap = {
  star: <Star className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  rocket: <Rocket className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />
};

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(planId);

    try {
      // TODO: Get actual user ID from auth context
      const userId = 'demo-user-id';
      const result = await initiatePurchase(planId, userId);

      if (result.success) {
        if (result.checkoutUrl) {
          // Redirect to payment
          window.location.href = result.checkoutUrl;
        } else {
          // Free plan - credits added directly
          alert(result.message);
        }
      } else {
        alert(result.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Credit-Based Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Pay once, use anytime. Credits never expire.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {pricingFeatures.keyBenefits.map((benefit, index) => (
              <Badge key={index} variant="secondary" className="px-4 py-2">
                <Check className="w-4 h-4 mr-2" />
                {benefit}
              </Badge>
            ))}
          </div>

          {/* Credit Costs by AI Model */}
          <div className="max-w-2xl mx-auto mb-12">
            <RevoCreditCosts compact={true} />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-300 hover:shadow-lg ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${selectedPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4">
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500 text-sm"> one-time</span>}
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">{plan.credits}</div>
                  <div className="text-sm text-gray-500">credits</div>
                  {plan.price > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      ${plan.costPerCredit.toFixed(3)} per credit
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="text-sm text-left space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bonuses */}
                {plan.bonuses && plan.bonuses.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-semibold text-blue-800 mb-2">Bonus Features:</div>
                    <ul className="text-sm space-y-1">
                      {plan.bonuses.map((bonus, index) => (
                        <li key={index} className="flex items-start text-blue-700">
                          <Star className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={selectedPlan === plan.id}
                >
                  {selectedPlan === plan.id ? 'Selected' :
                    plan.price === 0 ? 'Get Started Free' : 'Buy Credits'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Detailed Credit Costs Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <RevoCreditCosts compact={false} />
        </div>

        {/* Future Add-ons Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Optional Add-ons (Coming Soon)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addOns.map((addon) => (
              <div key={addon.id} className="text-center p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{addon.name}</h3>
                <p className="text-gray-600 mb-4">{addon.description}</p>
                <div className="text-2xl font-bold text-blue-600">
                  ${addon.price}<span className="text-sm text-gray-500">/{addon.period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingFeatures.faq.map((item, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{item.question}</h3>
                <p className="text-gray-600 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
