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
  TrendingUp,
  Database,
  Clock,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppRoutesPaths } from '@/lib/routes';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { user, signOut, loading, getAccessToken } = useAuth();
  const { toast } = useToast();

  // Typewriter animation for "AI Designer"
  const [displayText, setDisplayText] = useState('');
  const fullText = 'AI Designer';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Simple typewriter animation that works properly without layout shift
  useEffect(() => {
    if (!isVisible) return;

    let currentIndex = 0;
    let isDeleting = false;

    const typewriterLoop = () => {
      const timer = setInterval(() => {
        if (!isDeleting) {
          // Typing phase
          if (currentIndex <= fullText.length) {
            const currentText = fullText.slice(0, currentIndex);
            // Always show at least a space to prevent layout shift
            setDisplayText(currentText || '\u00A0'); // Non-breaking space when empty
            currentIndex++;
          } else {
            // Pause at end before deleting
            clearInterval(timer);
            setTimeout(() => {
              isDeleting = true;
              typewriterLoop();
            }, 2000); // 2 second pause when complete
          }
        } else {
          // Deleting phase
          if (currentIndex > 0) {
            const currentText = fullText.slice(0, currentIndex - 1);
            // Always show at least a space to prevent layout shift
            setDisplayText(currentText || '\u00A0'); // Non-breaking space when empty
            currentIndex--;
          } else {
            // Pause before retyping - keep the space
            setDisplayText('\u00A0'); // Non-breaking space
            clearInterval(timer);
            setTimeout(() => {
              isDeleting = false;
              typewriterLoop();
            }, 500); // 0.5 second pause when empty
          }
        }
      }, isDeleting ? 75 : 150); // Faster deletion, slower typing
    };

    const initialTimer = typewriterLoop();

    return () => {
      // Cleanup is handled within the function
    };
  }, [isVisible, fullText]);

  // Heartbeat: ping server every 5 minutes to extend session (only for logged in users)
  useEffect(() => {
    let mounted = true;
    let interval: any = null;

    // Simplified session management for Supabase auth
    // Supabase handles session management automatically
    // Session state is now managed by the Navbar component


    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, [user, signOut]);

        const createCheckout = async (planId: string) => {
          // If auth is still loading, wait and inform the user
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
                // Keep frontend planId as-is (server expects 'try-free' for the free plan)
                const normalizedPlanId = planId;
                const res = await fetch('/api/create-checkout-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                  body: JSON.stringify({ planId: normalizedPlanId, quantity: 1, mode: 'payment', customerEmail: user.email, metadata: { userId: user.userId, planId: normalizedPlanId } })
                });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // If the Try Agent Free plan was requested, treat the response as completed and navigate to dashboard
            if (normalizedPlanId === 'try-free') {
              // Server grants free credits (no Stripe session required) and may return an id/url placeholder.
              router.push('/dashboard');
              return;
            }

            // Defer loading Stripe until needed to reduce initial bundle size
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
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

        const handleGetStarted = (planId?: string) => {
          try {
            // If auth is still loading, do nothing and notify user
            if (loading) {
              toast({ title: 'Please wait', description: 'Checking authentication status...', variant: 'default' });
              return;
            }

            // If user is not logged in, redirect to auth
            if (!user || !user.userId) {
              router.push('/auth');
              return;
            }

            // If a planId was provided, start the checkout flow for logged-in users
            if (planId) {
              void createCheckout(planId);
              return;
            }

            // Default action for logged-in users: go to dashboard
            router.push('/dashboard');
          } catch (error) {
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
      <Navbar currentPage="home" />

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">🤖 AI Agent Designer</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Meet the First
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent inline-block min-w-[420px] h-[1.2em] text-left leading-tight">
                {displayText}
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4 leading-relaxed">
              <strong>Train Once. Create Forever.</strong>
            </p>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Say goodbye to templates. Your personal AI designer learns your brand DNA and creates professional social media content in seconds—more consistent than human designers, faster than any team, and always ready to post.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={() => handleGetStarted()}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto cursor-pointer z-10 relative"
              >
                Start Free – No Credit Card Required
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                onClick={handleWatchDemo}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 h-auto border-gray-300 hover:bg-gray-50"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch 30s Demo
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
                <span>Trusted by 10,000+ businesses</span>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2">4.9/5 on G2</span>
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
              Why Teams Choose
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Crevo</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <strong>The Only AI Agent That Eliminates Design Work Forever</strong><br />
              Crevo's AI designer learns your brand, adapts to global audiences, and creates content in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Intelligent AI Designer */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🤖 Intelligent AI Designer</h3>
                <p className="text-gray-600 leading-relaxed">
                  Learns your brand DNA to create perfectly aligned content—<strong>no templates needed</strong>.
                  Your personal designer that understands your style, voice, and visual identity.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 - Multi-AI Architecture */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🧠 Multi-AI Architecture</h3>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Multiple quality tiers</strong> trained on thousands of professional designs.
                  Choose the perfect balance of quality and speed for your content needs.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 - Culturally Intelligent Agent */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🌍 Culturally Intelligent Agent</h3>
                <p className="text-gray-600 leading-relaxed">
                  Adapts content for <strong>local languages and trends</strong> (e.g., US vs. Japanese audiences).
                  Perfect for global businesses reaching diverse markets.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 - Business Intelligence Agent */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Business Intelligence Agent</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tracks <strong>RSS feeds, competitors, and trends</strong> to keep content fresh.
                  Your agent stays updated with market changes and industry news automatically.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 - Always-On Agent */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">⚡ Always-On Agent</h3>
                <p className="text-gray-600 leading-relaxed">
                  Creates <strong>platform-optimized content</strong> for Instagram, LinkedIn, Facebook, and more
                  in 30 seconds. Perfect dimensions and formatting every time.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 - Superhuman Consistency */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Superhuman Consistency</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your AI designer <strong>never forgets brand guidelines</strong>, never has off days, and never creates inconsistent content.
                  Perfect execution, every single time—something even the best human designers can't guarantee.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Agent vs Traditional Tools Section */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your AI Agent vs.
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Their Tools</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See why 10,000+ businesses choose Crevo's intelligent agent over template-based tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Traditional Tools Column */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Traditional Tools</h3>
                <p className="text-gray-600">(Canva, Buffer, etc.)</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">Browse 1000+ templates</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">Manually adjust colors & fonts</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">Hope for brand consistency</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">Repeat every time</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700"><strong>10–15 minutes per post</strong></span>
                </div>
              </div>
            </div>

            {/* Your AI Brand Agent Column */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🤖 Your AI Brand Agent</h3>
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Intelligent
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Train your agent once</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Agent creates instantly</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Agent remembers everything</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Agent works 24/7</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700"><strong>30 seconds per post</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => handleGetStarted()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto"
            >
              See How It Works
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              <strong>Get Started in Under 5 Minutes</strong><br />
              Train your AI agent and start creating professional content instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Train Your Agent</h3>
              <p className="text-gray-600 leading-relaxed">
                Enter your <strong>website URL</strong>, and your AI learns your brand's voice and style.
                Your agent analyzes colors, fonts, messaging, and visual identity automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Generate Content</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose a <strong>platform</strong>, and your agent creates tailored posts in seconds.
                Perfect dimensions, on-brand colors, and engaging copy—automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Publish & Grow</h3>
              <p className="text-gray-600 leading-relaxed">
                Share <strong>optimized content</strong> and track engagement with analytics.
                Your agent learns from performance to create even better content over time.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              onClick={() => handleGetStarted()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto"
            >
              Start Free
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
              Loved by Businesses Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              <strong>See Why Teams Trust Crevo's AI Agent</strong>
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
                  "Our AI agent cut post creation from 15 minutes to 30 seconds. Engagement soared by 300%! It's like having a designer that never sleeps."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=face&auto=format&q=80"
                    alt="Sarah Chen"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    loading="lazy"
                    unoptimized
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Sarah Chen</p>
                    <p className="text-sm text-gray-600">Marketing Director, TechFlow</p>
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
                  "It's like a designer that never sleeps. Perfectly on-brand every time. The agent learns our style and creates content that looks like our team made it."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format&q=80"
                    alt="Marcus Rodriguez"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    loading="lazy"
                    unoptimized
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Marcus Rodriguez</p>
                    <p className="text-sm text-gray-600">Founder, GrowthLab</p>
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
                  "We serve 3x more clients with the same team. Crevo's agent is a game changer. The cultural intelligence makes our global campaigns resonate perfectly."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format&q=80"
                    alt="Alex Thompson"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    loading="lazy"
                    unoptimized
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Alex Thompson</p>
                    <p className="text-sm text-gray-600">CEO, Creative Studio</p>
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
                  <p className="text-gray-600">We've trained our model with thousands of professional designs to understand what makes great visual content.</p>
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
              Train Your AI Agent Today
            </h2>
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

            {/* AI Model Costs */}
            <div className="max-w-2xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Credit Costs by Quality Tier:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-sm font-medium">Basic</div>
                  <div className="text-lg font-bold text-blue-600">2 credits</div>
                  <div className="text-xs text-gray-500">Fast & Efficient</div>
                </div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-sm font-medium">Enhanced</div>
                  <div className="text-lg font-bold text-purple-600">3 credits</div>
                  <div className="text-xs text-gray-500">Higher Quality</div>
                </div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-sm font-medium">Premium</div>
                  <div className="text-lg font-bold text-indigo-600">3.5 credits</div>
                  <div className="text-xs text-gray-500">Best Quality</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
         
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
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

            {/* Starter Pack */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
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

            {/* Growth Pack - Most Popular */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-blue-500 scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
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

           
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
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

            {/* Power Users Pack */}
            <Card className="relative transition-all duration-300 hover:shadow-lg border-2 border-gray-200">
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
              <div>
                <h4 className="font-semibold mb-2">How does the AI agent train?</h4>
                <p className="text-gray-600 text-sm">Your agent analyzes your website and content to learn your brand's voice, colors, and style.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What do credits do?</h4>
                <p className="text-gray-600 text-sm">Credits power content generation with different quality tiers: Basic = 2 credits, Enhanced = 3 credits, Premium = 3.5 credits per post.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Do credits expire?</h4>
                <p className="text-gray-600 text-sm">No, credits never expire. Use them anytime.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">How does Crevo compare to Canva?</h4>
                <p className="text-gray-600 text-sm">Crevo's AI agent learns your brand and automates content with cultural intelligence, unlike Canva's template-based tools.</p>
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
                Ready to Meet Your AI Designer?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join 10,000+ businesses who trust their AI agent to create professional content. Train your agent in under 5 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => handleGetStarted()}
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4 h-auto font-semibold"
                >
                  Start Free
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
      <Footer />
    </div>
  );
}
