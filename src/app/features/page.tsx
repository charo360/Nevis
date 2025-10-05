'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Sparkles,
  Globe,
  TrendingUp,
  Target,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Users,
  BarChart3,
  Shield,
  Rocket,
  Cpu,
  Eye,
  Palette,
  MessageSquare,
  Clock,
  Award,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import { AppRoutesPaths } from '@/lib/routes';

export default function FeaturesPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-500" />,
      title: "AI Agent Training",
      description: "Your AI learns your brand's voice, colors, and style from your website and content automatically.",
      details: ["Website analysis", "Brand voice learning", "Color palette extraction", "Style pattern recognition"]
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      title: "Cultural Intelligence",
      description: "Location-aware content with local language integration for global businesses.",
      details: ["Multi-language support", "Regional preferences", "Cultural context awareness", "Localized messaging"]
    },
    {
      icon: <Globe className="w-8 h-8 text-green-500" />,
      title: "Real-Time Context",
      description: "RSS feeds, competitor analysis, and trending topics integration for fresh content.",
      details: ["Live RSS integration", "Competitor monitoring", "Trend analysis", "Market intelligence"]
    },
    {
      icon: <Target className="w-8 h-8 text-orange-500" />,
      title: "Platform Optimization",
      description: "Automatic aspect ratio detection and content optimization for all social platforms.",
      details: ["Instagram optimization", "Facebook formatting", "Twitter/X sizing", "LinkedIn professional layout"]
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Lightning Fast Generation",
      description: "Create professional content in seconds, not hours. From concept to publish instantly.",
      details: ["30-second generation", "Bulk creation", "Template library", "One-click publishing"]
    },
    {
      icon: <Shield className="w-8 h-8 text-indigo-500" />,
      title: "Brand Consistency",
      description: "Every post maintains your brand identity across all platforms and campaigns.",
      details: ["Consistent messaging", "Brand color adherence", "Logo placement", "Tone of voice"]
    }
  ];

  const capabilities = [
    {
      icon: <Palette className="w-6 h-6 text-blue-500" />,
      title: "Visual Design",
      description: "Stunning graphics, perfect typography, and professional layouts"
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-purple-500" />,
      title: "Copywriting",
      description: "Engaging captions, hashtags, and compelling storytelling"
    },
    {
      icon: <Eye className="w-6 h-6 text-green-500" />,
      title: "Brand Analysis",
      description: "Deep website scraping and brand personality extraction"
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      title: "Content Calendar",
      description: "Strategic posting schedules and content planning"
    },
    {
      icon: <Award className="w-6 h-6 text-yellow-500" />,
      title: "Quality Assurance",
      description: "AI-powered content review and optimization suggestions"
    },
    {
      icon: <Rocket className="w-6 h-6 text-indigo-500" />,
      title: "Performance Tracking",
      description: "Analytics integration and engagement monitoring"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crevo
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href={AppRoutesPaths.home} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
            <Link href={AppRoutesPaths.features} className="text-blue-600 font-semibold">Features</Link>
            <Link href={AppRoutesPaths.pricing} className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href={AppRoutesPaths.about} className="text-gray-600 hover:text-gray-900 transition-colors">About</Link>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Lightbulb className="w-4 h-4 mr-2" />
              Advanced AI Features
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionary AI
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Features</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover the most advanced AI content creation platform. From intelligent brand learning to cultural adaptation,
              Crevo's features are designed for the future of social media marketing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                Start Creating
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="relative px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Six powerful capabilities that make Crevo the most advanced AI content platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete Content Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and optimize your social media content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl hover:shadow-lg transition-all duration-300">
                <div className="flex-shrink-0">
                  {capability.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{capability.title}</h3>
                  <p className="text-gray-600 text-sm">{capability.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="relative px-6 py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI Model Tiers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect AI quality level for your content needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">Basic AI</h3>
                <p className="text-gray-600 mb-6">Fast, efficient generation for quick content needs</p>
                <div className="text-3xl font-bold text-blue-600 mb-2">2 credits</div>
                <div className="text-sm text-gray-500">per generation</div>
                <ul className="text-sm text-left space-y-2 mt-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Quick processing
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Cost effective
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Good quality
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">Most Popular</Badge>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">Enhanced AI</h3>
                <p className="text-gray-600 mb-6">Higher quality with advanced features and artifacts</p>
                <div className="text-3xl font-bold text-purple-600 mb-2">3 credits</div>
                <div className="text-sm text-gray-500">per generation</div>
                <ul className="text-sm text-left space-y-2 mt-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Advanced models
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Better quality
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Creative artifacts
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="relative border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">Premium AI</h3>
                <p className="text-gray-600 mb-6">Best quality with maximum creativity and detail</p>
                <div className="text-3xl font-bold text-indigo-600 mb-2">3.5 credits</div>
                <div className="text-sm text-gray-500">per generation</div>
                <ul className="text-sm text-left space-y-2 mt-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Maximum quality
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Highest creativity
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Professional grade
                  </li>
                </ul>
              </CardContent>
            </Card>
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
                Ready to Experience the Future?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join thousands of businesses using Crevo's advanced AI features to create stunning content.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-4">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-gray-900 hover:bg-white hover:text-gray-900 text-lg px-8 py-4">
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}