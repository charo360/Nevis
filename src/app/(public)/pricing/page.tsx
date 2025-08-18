'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, Rocket, ArrowLeft } from 'lucide-react';
import { PricingCard } from '@/components/pricing/PricingCard';
import { RevoCreditCosts } from '@/components/pricing/RevoCreditCosts';
import { pricingPlans, addOns, pricingFeatures } from '@/lib/pricing-data';
import { initiatePurchase } from '@/app/actions/pricing-actions';
import Link from 'next/link';

// Icon mapping for dynamic loading
const iconMap = {
  star: <Star className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  rocket: <Rocket className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />
};

export default function PublicPricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    // Redirect to auth for plan selection
    window.location.href = `/auth?plan=${planId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
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
            <PricingCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              price={plan.price}
              credits={plan.credits}
              costPerCredit={plan.costPerCredit}
              icon={iconMap[plan.icon as keyof typeof iconMap]}
              popular={plan.popular}
              features={plan.features}
              bonuses={plan.bonuses}
              description={plan.description}
              selected={selectedPlan === plan.id}
              onSelect={handleSelectPlan}
            />
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
