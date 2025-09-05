// src/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Target,
  Palette,
  BarChart3,
  CheckCircle,
  Star,
  Play,
  ChevronRight,
  Globe,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { user, signOut } = useAuth();
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const { toast } = useToast();
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Heartbeat: ping server every 5 minutes to extend session (only for logged in users)
  useEffect(() => {
    let mounted = true;
    let interval: any = null;

    async function getIdTokenSafe() {
      try {
        if (!auth || !auth.currentUser) return null;
        return await auth.currentUser.getIdToken();
      } catch (e) {
        return null;
      }
    }

    async function sendHeartbeat() {
      if (!user || !user.uid) return;
      try {
        const idToken = await getIdTokenSafe();
        const headers: any = { 'Content-Type': 'application/json' };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        await fetch('/api/auth/heartbeat', { method: 'POST', headers });
      } catch (e) {
        // ignore
      }
    }

    async function checkSession() {
      if (!user || !user.uid) return;
      try {
        const idToken = await getIdTokenSafe();
        const headers: any = { 'Content-Type': 'application/json' };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const res = await fetch('/api/auth/check-session', { method: 'POST', headers });
        const json = await res.json();
        if (!json.ok) {
          // If session inactive or expired, sign user out on client
          if (json.reason === 'inactive' || json.reason === 'expired') {
            try {
              await signOut();
              // reload to reflect logged-out state
              window.location.reload();
            } catch (e) {
              window.location.href = '/auth';
            }
          }
        }
      } catch (e) {
        // ignore network errors
      }
    }

    // Start initial check and heartbeat
    if (user && user.uid) {
      sendHeartbeat();
      checkSession();
      interval = setInterval(() => {
        sendHeartbeat();
        checkSession();
      }, 5 * 60 * 1000); // every 5 minutes
    }

    // Also run a one-off session check to update UI (dashboard link)
    (async () => {
      if (!user || !user.uid) {
        setSessionActive(false);
        return;
      }

      // Optimistically show dashboard while we verify session with server
      setSessionActive(true);

      try {
        const idToken = await getIdTokenSafe();
        const headers: any = { 'Content-Type': 'application/json' };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const res = await fetch('/api/auth/check-session', { method: 'POST', headers });
        const json = await res.json();

        if (json.ok) {
          setSessionActive(true);
          return;
        }

        // Server explicitly invalidated session -> sign out
        if (json.reason === 'inactive' || json.reason === 'expired') {
          try {
            await signOut();
          } catch (e) {
            // ignore
          }
          setSessionActive(false);
          // reload to update UI
          window.location.reload();
          return;
        }

        // If server can't verify due to permission issues, keep showing dashboard but warn in console
        if (json.reason === 'permission_denied') {
          setSessionActive(true);
          return;
        }

        // Default: keep dashboard visible
        setSessionActive(true);
      } catch (e) {
        setSessionActive(true);
      }
    })();

    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, [user, signOut]);

  const handleGetStarted = () => {
    try {
      router.push('/auth');
    } catch (error) {
    }
  };

  const createCheckout = async (priceId: string) => {
    if (!user || !user.uid) {
      router.push('/auth');
      return;
    }

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, quantity: 1, mode: 'payment', customerEmail: user.email, metadata: { userId: user.uid, priceId } })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      if (data.url) {
        window.location.href = data.url;
      } else if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Checkout failed', description: String(err.message || err) });
    }
  };

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleWatchDemo = () => {
    // Add demo video functionality later
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crevo
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            {sessionActive ? (
              <Button onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSignIn}
                  variant="outline"
                  className="border-gray-300  text-black cursor-pointer z-10 relative"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 cursor-pointer z-10 relative"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Content Creation</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              AI-Powered Brand
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Content Creation
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              The only platform with <strong>Multi-AI Architecture</strong>, <strong>Cultural Intelligence</strong>, and <strong>Business Context</strong>.
              Generate platform-optimized content that understands your brand, location, and audience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto cursor-pointer z-10 relative"
              >
                Start Creating Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                onClick={handleWatchDemo}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 h-auto border-gray-300 hover:bg-gray-50"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white" />
                  ))}
                </div>
                <span>Trusted by 10,000+ creators</span>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Crevo Beats
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> The Competition</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlike Canva, Buffer, or Jasper - Crevo combines <strong>3 AI models</strong>, <strong>cultural intelligence</strong>,
              and <strong>business context</strong> in one platform. Here's what makes us different:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Multi-AI Architecture */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Multi-AI Architecture</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Revo 1.0, 1.5 & 2.0</strong> - Three specialized AI models for different quality levels.
                  Gemini 2.5 Flash + OpenAI GPT + AIML FLUX working together for superior results.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 - Cultural Intelligence */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cultural Intelligence</h3>
                <p className="text-gray-600 leading-relaxed">
                  Location-aware content with <strong>local language integration</strong>. AI understands cultural context
                  and creates region-specific content that resonates with your audience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 - Business Intelligence */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Intelligence</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>RSS feeds</strong>, <strong>competitor analysis</strong>, and <strong>trending topics</strong> integration.
                  AI creates content based on real-time business context and market trends.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 - Platform-Specific Optimization */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Platform-Specific Optimization</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Automatic aspect ratio detection</strong> for Instagram (1:1), Facebook (16:9), Stories (9:16).
                  Each platform gets perfectly optimized dimensions and content.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 - Brand-Scoped Management */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Brand Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Brand-scoped storage</strong>, colors, logos, and voice consistency.
                  Manage multiple brands with complete isolation and professional brand intelligence.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 - Unlimited Storage */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Unlimited Content Generation</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Advanced quota management</strong> prevents storage issues. Generate unlimited posts
                  with automatic optimization and intelligent storage rotation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Competitive Comparison Section */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Crevo Compares to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> The Competition</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See why businesses choose Crevo over Canva, Buffer, Jasper, and other platforms
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Crevo
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Canva</th>
                  <th className="px-6 py-4 text-center font-semibold">Buffer</th>
                  <th className="px-6 py-4 text-center font-semibold">Jasper</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Multi-AI Architecture</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Cultural Intelligence</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Business Intelligence (RSS, Trends)</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-orange-400">Limited</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Platform-Specific Optimization</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-orange-400">Basic</td>
                  <td className="px-6 py-4 text-center text-orange-400">Basic</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">AI Content + Design Integration</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-orange-400">Limited AI</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-orange-400">Text Only</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Brand-Scoped Management</td>
                  <td className="px-6 py-4 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-orange-400">Basic</td>
                  <td className="px-6 py-4 text-center text-orange-400">Basic</td>
                  <td className="px-6 py-4 text-center text-orange-400">Basic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Create Brand Profile</h3>
              <p className="text-gray-600 leading-relaxed">
                Set up your brand with <strong>colors, logo, location, and business type</strong>.
                Our AI analyzes your brand context and cultural requirements automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Choose AI Model & Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Select from <strong>Revo 1.0, 1.5, or 2.0</strong> based on quality needs.
                Pick your platform (Instagram, Facebook, Twitter) for automatic optimization.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Generate & Download</h3>
              <p className="text-gray-600 leading-relaxed">
                AI creates <strong>culturally-aware content</strong> with trending topics, business intelligence,
                and perfect aspect ratios. Download HD images instantly.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by creators worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of businesses and creators who trust Crevo for their content needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "The multi-AI architecture is game-changing! Revo 2.0 creates stunning designs while the cultural intelligence helps us connect with our global audience. No other platform comes close."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Chen</p>
                    <p className="text-sm text-gray-600">Marketing Director, Global Tech</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "The business intelligence integration is incredible! RSS feeds and trending topics keep our content fresh and relevant. The platform-specific optimization saves us hours of manual work."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Marcus Rodriguez</p>
                    <p className="text-sm text-gray-600">Founder, Digital Agency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Finally, a platform that understands international markets! The cultural intelligence creates content that resonates locally while maintaining brand consistency. Unlimited storage is a huge bonus."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Alex Thompson</p>
                    <p className="text-sm text-gray-600">CEO, International Brand Agency</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Differentiators Section */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Makes Crevo
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Unique</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The only AI content platform built for global businesses with advanced intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Key points */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">3 AI Models in One Platform</h3>
                  <p className="text-gray-600">Gemini 2.5 Flash + OpenAI GPT + AIML FLUX working together. Choose quality level based on your needs and budget.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Cultural Intelligence</h3>
                  <p className="text-gray-600">Location-aware content with local language integration. Perfect for international businesses and global brands.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Business Context</h3>
                  <p className="text-gray-600">RSS feeds, competitor analysis, and trending topics integration. Your content stays fresh and relevant automatically.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Platform-Perfect Optimization</h3>
                  <p className="text-gray-600">Automatic aspect ratio detection and content optimization for Instagram, Facebook, Twitter, LinkedIn, and more.</p>
                </div>
              </div>
            </div>

            {/* Right side - Visual representation */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                      <Sparkles className="w-4 h-4" />
                      Crevo AI Platform
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Multi-AI Models</span>
                      <Badge className="bg-blue-600">3 Models</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Cultural Intelligence</span>
                      <Badge className="bg-purple-600">Global</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Business Context</span>
                      <Badge className="bg-green-600">Real-time</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Platform Optimization</span>
                      <Badge className="bg-orange-600">Auto</Badge>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">All-in-One</div>
                    <div className="text-sm text-gray-600">Content Creation Platform</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative px-6 py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Credit-Based
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Pay once, use anytime. Credits never expire. Choose the AI quality that fits your needs.
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

            {/* AI Model Costs */}
            <div className="max-w-2xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Credit Costs by AI Model:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-sm font-medium">Revo 1.0</div>
                  <div className="text-lg font-bold text-blue-600">1 credit</div>
                  <div className="text-xs text-gray-500">Basic AI</div>
                </div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-sm font-medium">Revo 1.5</div>
                  <div className="text-lg font-bold text-purple-600">1.5 credits</div>
                  <div className="text-xs text-gray-500">Enhanced AI</div>
                </div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-sm font-medium">Revo 2.0</div>
                  <div className="text-lg font-bold text-indigo-600">2 credits</div>
                  <div className="text-xs text-gray-500">Premium AI</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {/* Free Plan */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Star className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Free Plan</h3>
                <p className="text-sm text-gray-600 mb-4">Perfect for trying out Crevo AI</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">$0</span>
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
                  onClick={handleGetStarted}
                  className="w-full"
                  variant="outline"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Starter Pack */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Starter Pack</h3>
                <p className="text-sm text-gray-600 mb-4">Ideal for occasional users</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">$10</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">50</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.20 per credit</div>
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
                  onClick={() => createCheckout('price_1RxYHyFptxIKIuiwekVOOCf3')}
                  className="w-full"
                  variant="outline"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Growth Pack - Most Popular */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-blue-500 scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>

              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Growth Pack</h3>
                <p className="text-sm text-gray-600 mb-4">Most popular for growing businesses</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">$29</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">150</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.19 per credit</div>
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
                  onClick={() => createCheckout('price_1RxYIwFptxIKIuiwMVPibdo5')}
                  className="w-full"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Pro Pack */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pro Pack</h3>
                <p className="text-sm text-gray-600 mb-4">For professional creators</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">250</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.196 per credit</div>
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
                  onClick={() => createCheckout('price_1RxYJzFptxIKIuiwqcRemLE8')}
                  className="w-full"
                  variant="outline"
                >
                  Buy Credits
                </Button>
              </CardContent>
            </Card>

            {/* Power Users Pack */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Brain className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Power Users</h3>
                <p className="text-sm text-gray-600 mb-4">For agencies & power users</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold">$99</span>
                  <span className="text-gray-500 text-sm"> one-time</span>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-semibold text-blue-600">550</div>
                  <div className="text-sm text-gray-500">credits</div>
                  <div className="text-xs text-gray-400 mt-1">$0.18 per credit</div>
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
                  onClick={() => createCheckout('price_1RxYKfFptxIKIuiwCql1Wj0u')}
                  className="w-full"
                  variant="outline"
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
              <div>
                <h4 className="font-semibold mb-2">How do credits work?</h4>
                <p className="text-gray-600 text-sm">Credits vary by AI model: Revo 1.0 = 1 credit, Revo 1.5 = 1.5 credits, Revo 2.0 = 2 credits per generation.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Do credits expire?</h4>
                <p className="text-gray-600 text-sm">No! Your credits never expire. Use them whenever you need them.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I upgrade anytime?</h4>
                <p className="text-gray-600 text-sm">Yes! You can purchase additional credit packs anytime. Credits stack up.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What's the difference between AI models?</h4>
                <p className="text-gray-600 text-sm">Higher versions provide better quality, more features, and enhanced AI capabilities but cost more credits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to transform your content?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join thousands of creators and businesses who are already using Crevo to create amazing content. Start your free trial today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold"
                >
                  Start Creating Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-5 h-5" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Crevo</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-powered content creation platform that helps businesses and creators generate stunning social media content in seconds.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 Crevo. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
