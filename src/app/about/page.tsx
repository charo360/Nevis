'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Sparkles,
  Globe,
  TrendingUp,
  Target,
  Users,
  Shield,
  Rocket,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Lightbulb,
  Zap,
  Eye,
  MessageSquare,
  Palette,
  Clock,
  BarChart3,
  Heart,
  Code,
  Smartphone,
  Monitor,
  Cpu,
  Network,
  Play,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { AppRoutesPaths } from '@/lib/routes';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth-supabase';

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStartJourney = () => {
    if (user && !loading) {
      // User is already logged in, take them to dashboard
      router.push(AppRoutesPaths.dashboard.root);
    } else {
      // User not logged in, take them to auth/signup
      router.push('/auth?mode=signup');
    }
  };

  const milestones = [
    { year: "2023", event: "Company founded with vision to democratize AI content creation" },
    { year: "2024", event: "Launched first AI agent training platform with cultural intelligence" },
    { year: "2024", event: "Reached 10,000+ businesses using Crevo globally" },
    { year: "2025", event: "Expanded to 50+ countries with multi-language support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar currentPage="about" />

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Our Story
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionizing Content
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Creation</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
              Crevo is the world's first AI-powered content creation platform that trains personalized AI agents
              to understand your brand's unique voice, style, and cultural context.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                onClick={handleStartJourney}
                disabled={loading}
              >
                {user ? 'Go to Dashboard' : 'Start Your Journey'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4"
                onClick={() => router.push(AppRoutesPaths.features)}
              >
                <Play className="mr-2 w-5 h-5" />
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is Crevo */}
      <section className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                What is Crevo?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Crevo is an intelligent AI content creation platform that goes beyond traditional design tools.
                Unlike Canva or Adobe Spark, Crevo creates a personalized AI agent that learns your brand's
                unique identity, voice, and cultural context.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Your AI agent becomes an extension of your creative team, understanding not just what you want
                to create, but how you want it to look, sound, and feel. It's like having a designer who never sleeps,
                speaks your brand language fluently, and understands your market's cultural nuances.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  <Brain className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Globe className="w-3 h-3 mr-1" />
                  Culturally Aware
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Target className="w-3 h-3 mr-1" />
                  Brand Consistent
                </Badge>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Your AI Creative Partner</h3>
                  <p className="text-gray-600">
                    A personalized AI agent that understands your brand better than any human designer ever could.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Crevo Works */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How Crevo Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From website analysis to content creation - your AI agent learns and creates in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">1. Website Analysis</h3>
                <p className="text-gray-600">
                  Your AI agent scans your website, extracting brand colors, fonts, messaging, and visual style.
                  It understands your tone, values, and target audience.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">2. AI Training</h3>
                <p className="text-gray-600">
                  Using advanced machine learning, your agent learns your brand's unique personality.
                  It understands cultural context and communication preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">3. Content Creation</h3>
                <p className="text-gray-600">
                  Your agent creates stunning visuals and copy that perfectly match your brand.
                  Every post is optimized for the target platform and audience.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">4. Publish & Grow</h3>
                <p className="text-gray-600">
                  Share your content directly to social platforms. Your agent learns from performance
                  and continuously improves future content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Advanced Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge AI technologies for unparalleled content creation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Computer Vision</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Advanced image recognition and analysis to understand visual elements,
                  color schemes, and design patterns from your website and brand materials.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Color palette extraction</li>
                  <li>• Typography analysis</li>
                  <li>• Layout pattern recognition</li>
                  <li>• Brand asset identification</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Natural Language Processing</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Sophisticated language models that understand context, tone, and cultural nuances
                  to create copy that resonates with your target audience.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Tone analysis</li>
                  <li>• Cultural context awareness</li>
                  <li>• Multi-language support</li>
                  <li>• Brand voice learning</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Network className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Machine Learning</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Continuous learning algorithms that improve over time, adapting to your
                  preferences and performance data for better results.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Performance optimization</li>
                  <li>• A/B testing automation</li>
                  <li>• Trend analysis</li>
                  <li>• Personalization</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on cutting-edge machine learning models and years of research in AI-driven creativity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">AI Agent Architecture</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Our proprietary AI agents learn from your brand's unique voice, style, and cultural context to create perfectly aligned content every time.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="text-xs">Machine Learning</Badge>
                  <Badge variant="secondary" className="text-xs">Neural Networks</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Real-Time Processing</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Lightning-fast content generation powered by distributed computing and optimized AI models for instant results.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="text-xs">Cloud Infrastructure</Badge>
                  <Badge variant="secondary" className="text-xs">GPU Acceleration</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Enterprise Security</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Bank-level encryption and data protection ensure your brand information and content are always secure and private.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="text-xs">SOC 2 Compliant</Badge>
                  <Badge variant="secondary" className="text-xs">GDPR Ready</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To democratize professional content creation by making AI accessible to businesses of all sizes.
                We believe that every brand deserves to have a world-class creative team, and AI makes this possible.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Our vision is a world where creativity is no longer limited by budget or geography.
                Whether you're a local bakery or a global corporation, you should have access to
                professional-grade content creation tools that understand your unique brand identity.
              </p>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Values
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Innovation First</h3>
                    <p className="text-gray-600 text-sm">We push the boundaries of what's possible with AI technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Human-Centered</h3>
                    <p className="text-gray-600 text-sm">AI should augment human creativity, not replace it.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Cultural Respect</h3>
                    <p className="text-gray-600 text-sm">We celebrate and respect cultural diversity in content creation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a bold idea to transforming how the world creates content
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-8 mb-8">
                <div className="flex-shrink-0 w-20 text-right">
                  <div className="text-2xl font-bold text-blue-600">{milestone.year}</div>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                  <p className="text-gray-700">{milestone.event}</p>
                </div>
              </div>
            ))}
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
                Join Our Mission
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Be part of the AI content creation revolution. Create stunning, brand-consistent content
                that resonates with your audience worldwide.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4"
                  onClick={handleStartJourney}
                  disabled={loading}
                >
                  {user ? 'Go to Dashboard' : 'Start Creating Today'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-gray-900 hover:bg-white hover:text-gray-900 text-lg px-8 py-4"
                  onClick={() => router.push(AppRoutesPaths.pricing)}
                >
                  <DollarSign className="mr-2 w-5 h-5" />
                  View Pricing
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