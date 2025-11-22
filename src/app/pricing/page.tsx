'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import {
  Star,
  Zap,
  Target,
  BarChart3,
  Brain,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { user, loading, getAccessToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setIsVisible(true);

    // Handle hash navigation (e.g., #credit-packages)
    const hash = window.location.hash;
    if (hash) {
      // Wait for content to render, then scroll
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          // Get element position and scroll with offset for navbar
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - 80; // 80px offset for navbar

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300); // Increased timeout to ensure content is rendered
    }
  }, []);

  // Logic from homepage pricing section
  const createCheckout = async (planId: string) => {
    if (loading) {
      toast({ title: 'Please wait', description: 'Checking authentication status...', variant: 'default' });
      return;
    }

    if (!user || !user.userId) {
      toast({ title: 'Sign in required', description: 'You need to sign in before purchasing credits.', variant: 'default' });
      router.push('/auth');
      return;
    }

    try {
      const token = await getAccessToken();
      const normalizedPlanId = planId;
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          planId: normalizedPlanId,
          quantity: 1,
          mode: 'payment',
          customerEmail: user.email,
          metadata: { userId: user.userId, planId: normalizedPlanId }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (normalizedPlanId === 'try-free') {
        router.push('/dashboard');
        return;
      }

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error('Stripe failed to load');

      if (data.url) {
        window.location.href = data.url;
      } else if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Checkout failed', description: String(err?.message || err) });
    }
  };

  const handleGetStarted = (planId?: string) => {
    if (loading) {
      toast({ title: 'Please wait', description: 'Checking authentication status...', variant: 'default' });
      return;
    }

    if (!user || !user.userId) {
      router.push('/auth');
      return;
    }

    if (planId) {
      void createCheckout(planId);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar currentPage="pricing" />

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Transparent Pricing
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Simple, Credit-Based
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Pricing</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              <strong>Pay once, use anytime. Credits never expire.</strong>
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Compare: Canva Pro costs $120/year; our $24.99 Growth Agent trains your agent + creates 150+ posts.
            </p>

            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Credits Never Expire
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                No Monthly Commitment
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Variable AI Quality
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* AI Model Costs */}
      <section className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Credit Costs by Quality Tier
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect AI quality level for your content needs
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-16">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-lg font-medium mb-2">Basic</div>
                <div className="text-3xl font-bold text-blue-600 mb-2">3 credits</div>
                <div className="text-sm text-gray-500">Fast & Efficient</div>
              </div>
              <div className="p-6 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-lg font-medium mb-2">Enhanced</div>
                <div className="text-3xl font-bold text-purple-600 mb-2">4 credits</div>
                <div className="text-sm text-gray-500">Higher Quality</div>
              </div>
              <div className="p-6 border rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="text-lg font-medium mb-2">Premium</div>
                <div className="text-3xl font-bold text-indigo-600 mb-2">5 credits</div>
                <div className="text-sm text-gray-500">Best Quality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="credit-packages" className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {/* Try Agent Free */}
            <Card className="relative transition-all duration-300 hover:shadow-2xl border-2 border-gray-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Star className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Try Agent Free</h3>
                <p className="text-sm text-gray-600 mb-4">Basic agent training, Watermarked images</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold" data-plan="try-free" data-amount="0" data-currency="USD">$0</span>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">10</div>
                  <div className="text-sm text-gray-500">credits (one-time)</div>
                </div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Basic AI generation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Manual approval</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Limited support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Images include watermark</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleGetStarted('try-free')}
                  className="w-full"
                  variant="outline"
                  data-plan="try-free"
                  aria-label="Start Try Agent Free"
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Starter Agent */}
            <Card className="relative transition-all duration-300 hover:shadow-2xl border-2 border-gray-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Starter Agent</h3>
                <p className="text-sm text-gray-600 mb-4">HD generations, No watermark, Agent memory</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold" data-plan="starter" data-amount="999" data-currency="USD">$9.99</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">40</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.25 per credit</div>
                </div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>HD image generation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>No watermark on images</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Basic templates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleGetStarted('starter')}
                  className="w-full"
                  variant="outline"
                  data-plan="starter"
                  aria-label="Buy Starter Credits"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Growth Agent - Most Popular */}
            <Card className="relative transition-all duration-300 hover:shadow-2xl border-2 border-blue-500 scale-105 hover:scale-110">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                Most Popular
              </Badge>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Growth Agent</h3>
                <p className="text-sm text-gray-600 mb-4">Priority speed, Advanced models, Priority support</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold" data-plan="growth" data-amount="2499" data-currency="USD">$24.99</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">100</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.25 per credit</div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-800 mb-1">Bonus:</div>
                  <div className="text-sm text-blue-700">Priority generation speed</div>
                </div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced AI models</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Brand consistency tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleGetStarted('growth')}
                  className="w-full"
                  data-plan="growth"
                  aria-label="Buy Growth Credits"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Pro Agent */}
            <Card className="relative transition-all duration-300 hover:shadow-2xl border-2 border-gray-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pro Agent</h3>
                <p className="text-sm text-gray-600 mb-4">Bulk generations, API access, Early features</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold" data-plan="pro" data-amount="5999" data-currency="USD">$59.99</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">250</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.24 per credit</div>
                </div>
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-semibold text-purple-800 mb-1">Bonus:</div>
                  <div className="text-sm text-purple-700">Early access to new features</div>
                </div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced customization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Bulk generation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>API access</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleGetStarted('pro')}
                  className="w-full"
                  variant="outline"
                  data-plan="pro"
                  aria-label="Buy Pro Credits"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Agent */}
            <Card className="relative transition-all duration-300 hover:shadow-2xl border-2 border-gray-200 hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Brain className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Enterprise Agent</h3>
                <p className="text-sm text-gray-600 mb-4">White-label, Team collaboration, Custom integrations</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold" data-plan="enterprise" data-amount="19999" data-currency="USD">$199.99</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">1000</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.20 per credit</div>
                </div>
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm font-semibold text-indigo-800 mb-1">Bonus:</div>
                  <div className="text-sm text-indigo-700">Dedicated support + Custom styles</div>
                </div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>White-label options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Custom integrations</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleGetStarted('enterprise')}
                  className="w-full"
                  variant="outline"
                  data-plan="enterprise"
                  aria-label="Buy Enterprise Credits"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 text-gray-900">How does the AI agent train?</h4>
                <p className="text-gray-600 text-sm">Your agent analyzes your website and content to learn your brand's voice, colors, and style automatically.</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 text-gray-900">What do credits do?</h4>
                <p className="text-gray-600 text-sm">Credits power content generation with different quality tiers: Basic = 3 credits, Enhanced = 4 credits, Premium = 5 credits per post.</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 text-gray-900">Do credits expire?</h4>
                <p className="text-gray-600 text-sm">No, credits never expire. Use them anytime at your own pace.</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="font-semibold mb-3 text-gray-900">How does Crevo compare to Canva?</h4>
                <p className="text-gray-600 text-sm">Crevo's AI agent learns your brand and automates content with cultural intelligence, unlike Canva's template-based tools.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Content?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join thousands of businesses creating professional content with AI that understands their brand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4" onClick={() => handleGetStarted('try-free')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-gray-900 hover:bg-white hover:text-gray-900 text-lg px-8 py-4" onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"})}>
                  View Features
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}