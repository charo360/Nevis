'use client';

import React, { useState } from 'react';
import { BusinessProfile } from '@/lib/types/business-profile';

export default function SocialMediaExpertDemo() {
  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    businessName: '',
    businessType: '',
    industry: '',
    location: '',
    city: '',
    country: '',
    description: '',
    targetAudience: [],
    services: [],
    brandColors: [],
    visualStyle: ''
  });

  const [action, setAction] = useState('complete-package');
  const [platform, setPlatform] = useState('Instagram');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const businessTypes = [
    'restaurant', 'retail', 'healthcare', 'fitness', 'technology', 
    'education', 'real-estate', 'beauty', 'consulting', 'manufacturing'
  ];

  const industries = [
    'Food & Beverage', 'Fashion & Retail', 'Healthcare', 'Fitness & Wellness',
    'Technology', 'Education', 'Real Estate', 'Beauty & Personal Care',
    'Professional Services', 'Manufacturing', 'Hospitality', 'Automotive'
  ];

  const visualStyles = [
    'modern', 'rustic', 'professional', 'creative', 'minimalist', 'bold',
    'elegant', 'playful', 'sophisticated', 'authentic', 'luxury', 'casual'
  ];

  const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok'];

  const handleInputChange = (field: keyof BusinessProfile, value: any) => {
    setBusinessProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: keyof BusinessProfile, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setBusinessProfile(prev => ({
      ...prev,
      [field]: arrayValue
    }));
  };

  const generateSampleProfile = () => {
    const sampleProfile: BusinessProfile = {
      businessName: 'Samaki Cookies',
      businessType: 'restaurant',
      industry: 'Food & Beverage',
      location: 'Nairobi',
      city: 'Nairobi',
      country: 'Kenya',
      description: 'Artisanal cookie bakery specializing in nutritious, locally-sourced ingredients',
      mission: 'To provide healthy, delicious cookies while fighting malnutrition in Kenya',
      vision: 'To be the leading provider of nutritious baked goods in East Africa',
      founded: '2023',
      employeeCount: 15,
      targetAudience: ['Families', 'Health-conscious individuals', 'Children', 'Local businesses'],
      ageGroups: ['Children', 'Young adults', 'Families', 'Seniors'],
      interests: ['Healthy eating', 'Local food', 'Sustainability', 'Community health'],
      lifestyle: ['Health-conscious', 'Community-minded', 'Quality-focused'],
      services: ['Artisanal cookies', 'Custom orders', 'Corporate catering', 'Wholesale distribution'],
      products: ['Nutritious cookies', 'Gluten-free options', 'Seasonal specialties'],
      specialties: ['Malnutrition-fighting cookies', 'Local ingredient sourcing', 'Community health programs'],
      uniqueValue: 'Cookies that taste great AND fight malnutrition',
      competitiveAdvantages: ['Local ingredient sourcing', 'Health-focused recipes', 'Community impact'],
      brandColors: ['#8B4513', '#228B22', '#FFD700'],
      primaryColor: '#8B4513',
      accentColor: '#228B22',
      backgroundColor: '#FFFFFF',
      visualStyle: 'rustic',
      brandVoice: 'friendly',
      brandPersonality: ['Caring', 'Authentic', 'Community-focused', 'Health-conscious'],
      contentThemes: ['Health & nutrition', 'Local community', 'Sustainable business', 'Family values'],
      contentTone: 'educational',
      preferredPostTypes: ['Behind-the-scenes', 'Customer stories', 'Health tips', 'Community events'],
      contentFrequency: 'daily',
      platforms: ['Instagram', 'Facebook', 'LinkedIn'],
      primaryPlatform: 'Instagram',
      socialMediaGoals: ['Brand awareness', 'Community building', 'Education', 'Sales'],
      targetMetrics: ['Engagement', 'Followers', 'Website traffic', 'Conversions'],
      localCulture: ['Kenyan hospitality', 'Community values', 'Traditional food culture'],
      communityInvolvement: ['Local health programs', 'School partnerships', 'Community events'],
      localEvents: ['Nairobi Food Festival', 'Community Health Day', 'Local Markets'],
      seasonalFactors: ['Rainy season', 'Harvest time', 'School terms', 'Holiday seasons'],
      localCompetitors: ['Local bakeries', 'Supermarket brands', 'International chains'],
      challenges: ['Ingredient sourcing', 'Seasonal demand', 'Price sensitivity'],
      opportunities: ['Growing health awareness', 'Local partnerships', 'Export potential'],
      currentTrends: ['Healthy eating', 'Local sourcing', 'Community impact'],
      seasonalPromotions: ['Back-to-school cookies', 'Holiday specials', 'Rainy day comfort'],
      customerPainPoints: ['Finding healthy snacks', 'Supporting local business', 'Affordable quality'],
      customerSuccessStories: ['Improved child nutrition', 'Local business support', 'Community health'],
      testimonials: ['Amazing cookies that my kids love!', 'Great to support local business'],
      frequentlyAskedQuestions: ['Are they really healthy?', 'Do you deliver?', 'Can I order custom?'],
      brandImages: ['bakery interior', 'cookie making process', 'team photos'],
      productPhotos: ['cookie varieties', 'ingredients', 'packaging'],
      teamPhotos: ['baking team', 'delivery team', 'management'],
      locationPhotos: ['storefront', 'kitchen', 'dining area'],
      businessHours: 'Monday-Saturday 8AM-8PM, Sunday 9AM-6PM',
      contactInfo: {
        phone: '+254-700-000-000',
        email: 'hello@samakicookies.co.ke',
        website: 'www.samakicookies.co.ke',
        address: '123 Main Street, Nairobi, Kenya'
      },
      businessSeasonality: 'year-round',
      peakBusinessTimes: ['School terms', 'Holiday seasons', 'Weekends'],
      slowPeriods: ['School holidays', 'Rainy season'],
      specialEvents: ['Health awareness days', 'Local festivals', 'Corporate events'],
      contentVariety: 'high',
      creativeStyle: 'balanced',
      localRelevance: 'high',
      industryExpertise: 'educate'
    };

    setBusinessProfile(sampleProfile);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fill in missing required fields with defaults
      const completeProfile: BusinessProfile = {
        ...businessProfile,
        businessName: businessProfile.businessName || 'My Business',
        businessType: businessProfile.businessType || 'service',
        industry: businessProfile.industry || 'Professional Services',
        location: businessProfile.location || 'Global',
        city: businessProfile.city || 'Global',
        country: businessProfile.country || 'Global',
        description: businessProfile.description || 'Professional business services',
        mission: businessProfile.mission || 'To provide excellent service to our customers',
        vision: businessProfile.vision || 'To be the leading provider in our industry',
        founded: businessProfile.founded || '2024',
        employeeCount: businessProfile.employeeCount || 1,
        targetAudience: businessProfile.targetAudience || ['Businesses', 'Individuals'],
        ageGroups: businessProfile.ageGroups || ['Adults'],
        interests: businessProfile.interests || ['Quality', 'Service'],
        lifestyle: businessProfile.lifestyle || ['Professional'],
        services: businessProfile.services || ['Professional services'],
        products: businessProfile.products || ['Service packages'],
        specialties: businessProfile.specialties || ['Quality service'],
        uniqueValue: businessProfile.uniqueValue || 'Exceptional quality and service',
        competitiveAdvantages: businessProfile.competitiveAdvantages || ['Quality', 'Service'],
        brandColors: businessProfile.brandColors || ['#3B82F6', '#1E40AF'],
        primaryColor: businessProfile.primaryColor || '#3B82F6',
        accentColor: businessProfile.accentColor || '#1E40AF',
        backgroundColor: businessProfile.backgroundColor || '#FFFFFF',
        visualStyle: businessProfile.visualStyle || 'professional',
        brandVoice: businessProfile.brandVoice || 'professional',
        brandPersonality: businessProfile.brandPersonality || ['Professional', 'Reliable'],
        contentThemes: businessProfile.contentThemes || ['Business excellence'],
        contentTone: businessProfile.contentTone || 'educational',
        preferredPostTypes: businessProfile.preferredPostTypes || ['Business insights'],
        contentFrequency: businessProfile.contentFrequency || 'weekly',
        platforms: businessProfile.platforms || ['LinkedIn', 'Facebook'],
        primaryPlatform: businessProfile.primaryPlatform || 'LinkedIn',
        socialMediaGoals: businessProfile.socialMediaGoals || ['Brand awareness'],
        targetMetrics: businessProfile.targetMetrics || ['Engagement'],
        localCulture: businessProfile.localCulture || ['Professional'],
        communityInvolvement: businessProfile.communityInvolvement || ['Business networking'],
        localEvents: businessProfile.localEvents || ['Business events'],
        seasonalFactors: businessProfile.seasonalFactors || ['Business cycles'],
        localCompetitors: businessProfile.localCompetitors || ['Other service providers'],
        challenges: businessProfile.challenges || ['Market competition'],
        opportunities: businessProfile.opportunities || ['Market growth'],
        currentTrends: businessProfile.currentTrends || ['Digital transformation'],
        seasonalPromotions: businessProfile.seasonalPromotions || ['Year-round service'],
        customerPainPoints: businessProfile.customerPainPoints || ['Finding quality service'],
        customerSuccessStories: businessProfile.customerSuccessStories || ['Customer satisfaction'],
        testimonials: businessProfile.testimonials || ['Great service!'],
        frequentlyAskedQuestions: businessProfile.frequentlyAskedQuestions || ['What services do you offer?'],
        brandImages: businessProfile.brandImages || ['Business photos'],
        productPhotos: businessProfile.productPhotos || ['Service photos'],
        teamPhotos: businessProfile.teamPhotos || ['Team photos'],
        locationPhotos: businessProfile.locationPhotos || ['Office photos'],
        businessHours: businessProfile.businessHours || 'Monday-Friday 9AM-5PM',
        contactInfo: businessProfile.contactInfo || {
          phone: '+1-555-000-0000',
          email: 'hello@mybusiness.com',
          website: 'www.mybusiness.com',
          address: '123 Business St, City, Country'
        },
        businessSeasonality: businessProfile.businessSeasonality || 'year-round',
        peakBusinessTimes: businessProfile.peakBusinessTimes || ['Business hours'],
        slowPeriods: businessProfile.slowPeriods || ['Holidays'],
        specialEvents: businessProfile.specialEvents || ['Business milestones'],
        contentVariety: businessProfile.contentVariety || 'medium',
        creativeStyle: businessProfile.creativeStyle || 'balanced',
        localRelevance: businessProfile.localRelevance || 'medium',
        industryExpertise: businessProfile.industryExpertise || 'showcase'
      };

      const response = await fetch('/api/social-media-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          businessProfile: completeProfile,
          platform,
          count
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 AI Social Media Expert System
          </h1>
          <p className="text-xl text-gray-600">
            Get personalized social media strategies and content for your small business
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              📋 Business Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessProfile.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={businessProfile.businessType || ''}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  value={businessProfile.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={businessProfile.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={businessProfile.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={businessProfile.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your business..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience (comma-separated) *
                </label>
                <input
                  type="text"
                  value={businessProfile.targetAudience?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('targetAudience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Young professionals, Families, Small businesses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services (comma-separated) *
                </label>
                <input
                  type="text"
                  value={businessProfile.services?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('services', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Consulting, Design, Training"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Colors (comma-separated) *
                </label>
                <input
                  type="text"
                  value={businessProfile.brandColors?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('brandColors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., #3B82F6, #1E40AF, #FFFFFF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visual Style *
                </label>
                <select
                  value={businessProfile.visualStyle || ''}
                  onChange={(e) => handleInputChange('visualStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select visual style</option>
                  {visualStyles.map(style => (
                    <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="complete-package">Complete Package (Analysis + Strategy + Posts)</option>
                  <option value="analyze">Business Analysis Only</option>
                  <option value="generate-strategy">Generate Strategy</option>
                  <option value="generate-calendar">Generate Content Calendar</option>
                  <option value="generate-posts">Generate Posts Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Count
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={generateSampleProfile}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  📝 Load Sample Profile
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  {loading ? '🔄 Processing...' : '🚀 Generate Strategy'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              📊 Results
            </h2>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your business and generating strategy...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">❌ Error: {error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800">✅ {result.action} completed successfully!</p>
                </div>

                {result.data?.summaryReport && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">📋 Summary Report</h3>
                    <div className="bg-gray-50 rounded-md p-4 whitespace-pre-line text-sm text-gray-700">
                      {result.data.summaryReport}
                    </div>
                  </div>
                )}

                {result.data?.samplePosts && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">📝 Sample Posts</h3>
                    <div className="space-y-4">
                      {result.data.samplePosts.map((post: any, index: number) => (
                        <div key={post.id} className="bg-gray-50 rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {post.postCategory} • {post.platform}
                            </span>
                            <span className="text-xs text-gray-500">#{index + 1}</span>
                          </div>
                          <p className="text-gray-800 mb-2">{post.content}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.slice(0, 5).map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">{post.engagementPrompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.data?.contentCalendar && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">📅 Content Calendar</h3>
                    <div className="bg-gray-50 rounded-md p-4">
                      <h4 className="font-medium mb-2">Weekly Schedule:</h4>
                      <div className="space-y-2">
                        {result.data.contentCalendar.weeklySchedule?.map((day: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-medium">{day.day}</span>
                            <span className="text-gray-600">
                              {day.platform} • {day.category} • {day.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.data?.businessAnalysis && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">🔍 Business Analysis</h3>
                    <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-700">
                      <p><strong>Target Audience:</strong> {result.data.businessAnalysis.targetAudienceProfile}</p>
                      <p><strong>Content Opportunities:</strong> {result.data.businessAnalysis.contentOpportunities.slice(0, 3).join(', ')}</p>
                      <p><strong>Platform Strategy:</strong> {result.data.businessAnalysis.platformStrategy.join(', ')}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Generated at: {new Date(result.timestamp || Date.now()).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
