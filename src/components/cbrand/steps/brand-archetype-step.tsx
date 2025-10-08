// src/components/cbrand/steps/brand-archetype-step.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Heart,
  Compass,
  Star,
  Shield,
  Users,
  Lightbulb,
  Mountain,
  Home,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompleteBrandProfile } from '../cbrand-wizard';

export interface BrandArchetype {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  traits: string[];
  brandVoice: {
    tone: string[];
    messaging: string[];
    avoid: string[];
  };
  examples: string[];
  contentStyle: {
    visualStyle: string;
    contentThemes: string[];
    writingTone: string;
  };
  target: string;
}

export const BRAND_ARCHETYPES: BrandArchetype[] = [
  {
    id: 'innocent',
    name: 'The Innocent',
    tagline: 'Pure, wholesome, and optimistic',
    description: 'Represents safety, happiness, and purity. Appeals to those seeking comfort, security, and simple pleasures.',
    icon: Heart,
    colorClass: 'from-pink-400 to-rose-400',
    traits: ['Pure', 'Optimistic', 'Honest', 'Wholesome', 'Happy'],
    brandVoice: {
      tone: ['Warm', 'Friendly', 'Positive', 'Simple', 'Sincere'],
      messaging: ['Make life better', 'Simple solutions', 'Pure ingredients', 'Family-friendly', 'Natural goodness'],
      avoid: ['Complexity', 'Cynicism', 'Dark humor', 'Controversy', 'Aggressive sales']
    },
    examples: ['Coca-Cola', 'McDonald\'s Happy Meal', 'Dove', 'Johnson & Johnson Baby'],
    contentStyle: {
      visualStyle: 'clean, bright, soft colors, natural imagery',
      contentThemes: ['Family moments', 'Simple pleasures', 'Natural beauty', 'Feel-good stories', 'Community'],
      writingTone: 'warm, sincere, optimistic'
    },
    target: 'Families, health-conscious consumers, those seeking comfort'
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    tagline: 'Adventure, freedom, and discovery',
    description: 'Driven by wanderlust and the desire to experience new things. Values freedom, adventure, and authentic experiences.',
    icon: Compass,
    colorClass: 'from-blue-400 to-teal-400',
    traits: ['Adventurous', 'Independent', 'Authentic', 'Brave', 'Free-spirited'],
    brandVoice: {
      tone: ['Inspiring', 'Bold', 'Authentic', 'Rugged', 'Adventurous'],
      messaging: ['Just do it', 'Find your path', 'Adventure awaits', 'Break boundaries', 'Explore more'],
      avoid: ['Staying safe', 'Following rules', 'Comfort zones', 'Routine', 'Conformity']
    },
    examples: ['The North Face', 'Patagonia', 'Jeep', 'National Geographic', 'REI'],
    contentStyle: {
      visualStyle: 'natural landscapes, adventure scenes, earth tones, dynamic imagery',
      contentThemes: ['Adventure stories', 'Travel inspiration', 'Outdoor activities', 'Personal experiences', 'Discovery'],
      writingTone: 'inspiring, bold, authentic'
    },
    target: 'Adventure seekers, outdoor enthusiasts, independent thinkers'
  },
  {
    id: 'sage',
    name: 'The Sage',
    tagline: 'Wisdom, knowledge, and truth',
    description: 'Seeks truth and knowledge to understand the world. Shares wisdom and helps others learn and grow.',
    icon: Lightbulb,
    colorClass: 'from-indigo-400 to-purple-400',
    traits: ['Wise', 'Knowledgeable', 'Thoughtful', 'Expert', 'Mentor'],
    brandVoice: {
      tone: ['Authoritative', 'Educational', 'Thoughtful', 'Wise', 'Credible'],
      messaging: ['Knowledge is power', 'Learn something new', 'Expert insights', 'Informed decisions', 'Think different'],
      avoid: ['Oversimplification', 'Ignorance', 'Misinformation', 'Shallow content', 'Quick fixes']
    },
    examples: ['Harvard', 'Google', 'TED', 'MIT', 'BBC'],
    contentStyle: {
      visualStyle: 'clean, professional, educational graphics, data visualization',
      contentThemes: ['Educational content', 'Industry insights', 'Research findings', 'Expert opinions', 'How-to guides'],
      writingTone: 'authoritative, educational, insightful'
    },
    target: 'Professionals, students, knowledge seekers, decision makers'
  },
  {
    id: 'hero',
    name: 'The Hero',
    tagline: 'Courage, determination, and triumph',
    description: 'Rises to challenges and overcomes obstacles. Inspires others to be their best and achieve greatness.',
    icon: Shield,
    colorClass: 'from-red-400 to-orange-400',
    traits: ['Courageous', 'Determined', 'Strong', 'Inspiring', 'Triumphant'],
    brandVoice: {
      tone: ['Motivational', 'Strong', 'Confident', 'Inspiring', 'Determined'],
      messaging: ['Be your best', 'Rise to the challenge', 'Never give up', 'Strength through struggle', 'Victory awaits'],
      avoid: ['Weakness', 'Giving up', 'Accepting defeat', 'Playing it safe', 'Mediocrity']
    },
    examples: ['Nike', 'Under Armour', 'Red Bull', 'Tesla', 'Apple'],
    contentStyle: {
      visualStyle: 'bold, dynamic, action shots, strong contrasts',
      contentThemes: ['Success stories', 'Overcoming challenges', 'Achievement', 'Competition', 'Excellence'],
      writingTone: 'motivational, powerful, inspiring'
    },
    target: 'Athletes, achievers, ambitious individuals, competitive people'
  },
  {
    id: 'caregiver',
    name: 'The Caregiver',
    tagline: 'Compassion, care, and nurturing',
    description: 'Motivated by the desire to help others. Provides care, support, and protection to those in need.',
    icon: Users,
    colorClass: 'from-green-400 to-emerald-400',
    traits: ['Caring', 'Compassionate', 'Generous', 'Nurturing', 'Selfless'],
    brandVoice: {
      tone: ['Compassionate', 'Supportive', 'Caring', 'Gentle', 'Understanding'],
      messaging: ['We care about you', 'Here to help', 'Support when you need it', 'Taking care of family', 'Your wellbeing matters'],
      avoid: ['Selfishness', 'Neglect', 'Indifference', 'Harshness', 'Competition']
    },
    examples: ['Johnson & Johnson', 'UNICEF', 'Salvation Army', 'Habitat for Humanity', 'St. Jude'],
    contentStyle: {
      visualStyle: 'warm, soft, caring imagery, gentle colors, people-focused',
      contentThemes: ['Care stories', 'Support services', 'Community help', 'Health & wellness', 'Family care'],
      writingTone: 'compassionate, supportive, gentle'
    },
    target: 'Parents, healthcare workers, community-minded individuals'
  },
  {
    id: 'creator',
    name: 'The Creator',
    tagline: 'Innovation, creativity, and imagination',
    description: 'Driven to create something of enduring value. Values imagination, artistic expression, and innovation.',
    icon: Sparkles,
    colorClass: 'from-purple-400 to-pink-400',
    traits: ['Creative', 'Innovative', 'Imaginative', 'Artistic', 'Original'],
    brandVoice: {
      tone: ['Creative', 'Innovative', 'Inspiring', 'Artistic', 'Original'],
      messaging: ['Express yourself', 'Create something amazing', 'Unleash creativity', 'Make it unique', 'Art meets function'],
      avoid: ['Conformity', 'Copy-cat', 'Boring', 'Predictable', 'Mass-produced']
    },
    examples: ['Adobe', 'LEGO', 'Apple', 'Crayola', 'Pinterest'],
    contentStyle: {
      visualStyle: 'artistic, colorful, creative designs, unique layouts',
      contentThemes: ['Creative processes', 'Design inspiration', 'Innovation stories', 'Artistic expression', 'DIY projects'],
      writingTone: 'creative, inspiring, imaginative'
    },
    target: 'Artists, designers, creative professionals, makers'
  },
  {
    id: 'ruler',
    name: 'The Ruler',
    tagline: 'Leadership, power, and responsibility',
    description: 'Takes control and assumes leadership. Values stability, security, and creating order from chaos.',
    icon: Crown,
    colorClass: 'from-yellow-400 to-amber-400',
    traits: ['Authoritative', 'Responsible', 'Organized', 'Successful', 'Leader'],
    brandVoice: {
      tone: ['Authoritative', 'Confident', 'Professional', 'Prestigious', 'Exclusive'],
      messaging: ['Lead the way', 'Excellence is expected', 'Premium quality', 'Industry standard', 'For successful people'],
      avoid: ['Chaos', 'Poor quality', 'Unprofessionalism', 'Weakness', 'Following others']
    },
    examples: ['Mercedes-Benz', 'Rolex', 'IBM', 'Goldman Sachs', 'Harvard Business School'],
    contentStyle: {
      visualStyle: 'luxurious, premium, elegant, sophisticated',
      contentThemes: ['Leadership insights', 'Success strategies', 'Industry excellence', 'Premium experiences', 'Executive content'],
      writingTone: 'authoritative, sophisticated, premium'
    },
    target: 'Executives, luxury consumers, status-conscious individuals'
  },
  {
    id: 'magician',
    name: 'The Magician',
    tagline: 'Transformation, vision, and possibility',
    description: 'Makes dreams come true through transformation. Turns visions into reality and creates magical experiences.',
    icon: Star,
    colorClass: 'from-violet-400 to-purple-400',
    traits: ['Transformative', 'Visionary', 'Inspiring', 'Innovative', 'Magical'],
    brandVoice: {
      tone: ['Inspiring', 'Transformative', 'Visionary', 'Magical', 'Innovative'],
      messaging: ['Make it happen', 'Transform your life', 'Anything is possible', 'Dreams come true', 'Experience the magic'],
      avoid: ['Limitations', 'Impossibility', 'Skepticism', 'Ordinary', 'Predictable']
    },
    examples: ['Disney', 'Tesla', 'Apple', 'Google', 'SpaceX'],
    contentStyle: {
      visualStyle: 'magical, transformative, futuristic, inspiring visuals',
      contentThemes: ['Transformation stories', 'Innovation', 'Future vision', 'Magical moments', 'Possibility'],
      writingTone: 'inspiring, transformative, visionary'
    },
    target: 'Dreamers, innovators, forward-thinkers, experience seekers'
  },
  {
    id: 'everyman',
    name: 'The Everyman',
    tagline: 'Belonging, common sense, and relatability',
    description: 'Wants to fit in and belong. Values common sense, hard work, and authentic relationships with regular people.',
    icon: Home,
    colorClass: 'from-blue-400 to-indigo-400',
    traits: ['Relatable', 'Down-to-earth', 'Friendly', 'Practical', 'Authentic'],
    brandVoice: {
      tone: ['Friendly', 'Relatable', 'Down-to-earth', 'Practical', 'Conversational'],
      messaging: ['For everyone', 'Real value', 'Practical solutions', 'Everyday life', 'Good honest work'],
      avoid: ['Elitism', 'Pretension', 'Complexity', 'Exclusivity', 'Over-sophistication']
    },
    examples: ['IKEA', 'Target', 'Home Depot', 'Subway', 'Best Buy'],
    contentStyle: {
      visualStyle: 'approachable, realistic, everyday scenarios, warm colors',
      contentThemes: ['Everyday solutions', 'Practical tips', 'Real people stories', 'Value propositions', 'Community'],
      writingTone: 'friendly, conversational, practical'
    },
    target: 'Middle-class consumers, practical buyers, community-minded people'
  },
  {
    id: 'lover',
    name: 'The Lover',
    tagline: 'Passion, intimacy, and connection',
    description: 'Seeks and gives love. Values relationships, passion, commitment, and intimate connections with others.',
    icon: Heart,
    colorClass: 'from-rose-400 to-pink-400',
    traits: ['Passionate', 'Romantic', 'Committed', 'Intimate', 'Sensual'],
    brandVoice: {
      tone: ['Passionate', 'Romantic', 'Intimate', 'Sensual', 'Emotional'],
      messaging: ['Made with love', 'Share the moment', 'Feel the connection', 'Passionate about quality', 'Love at first sight'],
      avoid: ['Coldness', 'Logic over emotion', 'Impersonal', 'Casual', 'Indifference']
    },
    examples: ['Hallmark', 'Victoria\'s Secret', 'Godiva', 'De Beers', 'Häagen-Dazs'],
    contentStyle: {
      visualStyle: 'romantic, sensual, warm colors, intimate settings',
      contentThemes: ['Love stories', 'Relationships', 'Emotional moments', 'Passion projects', 'Connection'],
      writingTone: 'passionate, romantic, emotional'
    },
    target: 'Couples, romantic individuals, relationship-focused people'
  },
  {
    id: 'jester',
    name: 'The Jester',
    tagline: 'Fun, humor, and living in the moment',
    description: 'Brings joy and humor to the world. Values fun, spontaneity, and helping others enjoy life.',
    icon: Zap,
    colorClass: 'from-orange-400 to-yellow-400',
    traits: ['Playful', 'Humorous', 'Fun-loving', 'Spontaneous', 'Entertaining'],
    brandVoice: {
      tone: ['Playful', 'Humorous', 'Fun', 'Spontaneous', 'Lighthearted'],
      messaging: ['Have fun', 'Don\'t take life too seriously', 'Laugh a little', 'Life\'s a party', 'Enjoy the moment'],
      avoid: ['Seriousness', 'Formality', 'Rules', 'Boring', 'Uptight']
    },
    examples: ['Ben & Jerry\'s', 'Old Spice', 'Dollar Shave Club', 'Skittles', 'Geico'],
    contentStyle: {
      visualStyle: 'colorful, playful, humorous, unexpected elements',
      contentThemes: ['Funny content', 'Entertainment', 'Playful interactions', 'Light moments', 'Fun experiences'],
      writingTone: 'playful, humorous, entertaining'
    },
    target: 'Young adults, fun-seekers, stress-relievers, entertainment lovers'
  },
  {
    id: 'outlaw',
    name: 'The Outlaw',
    tagline: 'Revolution, disruption, and freedom',
    description: 'Breaks rules and challenges the status quo. Values freedom, revolution, and authentic self-expression.',
    icon: Target,
    colorClass: 'from-red-400 to-rose-400',
    traits: ['Rebellious', 'Free', 'Authentic', 'Disruptive', 'Independent'],
    brandVoice: {
      tone: ['Rebellious', 'Edgy', 'Bold', 'Authentic', 'Disruptive'],
      messaging: ['Break the rules', 'Think different', 'Challenge everything', 'Be yourself', 'Disrupt the norm'],
      avoid: ['Conformity', 'Following rules', 'Playing it safe', 'Traditional', 'Boring']
    },
    examples: ['Harley-Davidson', 'Virgin', 'Patagonia', 'PayPal', 'Uber'],
    contentStyle: {
      visualStyle: 'edgy, bold, unconventional, dark colors, striking imagery',
      contentThemes: ['Disruption stories', 'Challenging norms', 'Authentic expression', 'Freedom', 'Revolution'],
      writingTone: 'bold, rebellious, authentic'
    },
    target: 'Rebels, innovators, independent thinkers, change-makers'
  }
];

interface BrandArchetypeStepProps {
  brandProfile: CompleteBrandProfile;
  onUpdate: (updates: Partial<CompleteBrandProfile>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface ArchetypeRecommendation {
  recommendedArchetype: string;
  archetypeName: string;
  archetypeDescription: string;
  confidence: number;
  matchedKeywords: string[];
  reasoning: string;
}

export function BrandArchetypeStep({ brandProfile, onUpdate, onNext, onPrevious }: BrandArchetypeStepProps) {
  const [selectedArchetype, setSelectedArchetype] = React.useState<string | null>(
    brandProfile.brandArchetype || null
  );
  const [hoveredArchetype, setHoveredArchetype] = React.useState<string | null>(null);

  // Get AI recommendation from brand profile (if available from website analysis)
  const aiRecommendation = React.useMemo(() => {
    // Check if there's an archetype recommendation from website analysis
    const recommendation = (brandProfile as any).archetypeRecommendation as ArchetypeRecommendation | undefined;
    console.log('🤖 BrandArchetypeStep: Checking for AI recommendation:', {
      hasRecommendation: !!recommendation,
      recommendation,
      brandProfileKeys: Object.keys(brandProfile),
      brandProfile
    });



    return recommendation;
  }, [brandProfile]);

  // Auto-select AI recommendation if no archetype is selected yet
  React.useEffect(() => {
    if (!selectedArchetype && aiRecommendation && aiRecommendation.recommendedArchetype) {
      setSelectedArchetype(aiRecommendation.recommendedArchetype);
      // Don't auto-update the profile yet - let user confirm the selection
    }
  }, [aiRecommendation, selectedArchetype]);

  const handleArchetypeSelect = (archetypeId: string) => {
    const archetype = BRAND_ARCHETYPES.find(a => a.id === archetypeId);
    if (!archetype) return;

    setSelectedArchetype(archetypeId);

    // Update brand profile with archetype data
    onUpdate({
      brandArchetype: archetypeId,
      visualStyle: archetype.contentStyle.visualStyle,
      writingTone: archetype.contentStyle.writingTone,
      contentThemes: archetype.contentStyle.contentThemes.join(', '),
      brandVoice: archetype.brandVoice.tone.join(', '),
      brandPersonality: archetype.traits.join(', ')
    });
  };

  const selectedArchetypeData = selectedArchetype
    ? BRAND_ARCHETYPES.find(a => a.id === selectedArchetype)
    : null;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Brand Archetype
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Brand archetypes help define your personality, voice, and how you connect with your audience.
          This will guide your content creation and marketing approach.
        </p>
      </div>

      {/* AI Recommendation Banner */}
      {aiRecommendation && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-blue-900">
                    🤖 AI Recommendation
                  </h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {aiRecommendation.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-blue-800 mb-2">
                  <strong>{aiRecommendation.archetypeName}</strong> - {aiRecommendation.archetypeDescription}
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  {aiRecommendation.reasoning}
                </p>
                {aiRecommendation.matchedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-blue-600 mr-2">Keywords found:</span>
                    {aiRecommendation.matchedKeywords.map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs border-blue-300 text-blue-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {selectedArchetype === aiRecommendation.recommendedArchetype && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archetype Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {BRAND_ARCHETYPES.map((archetype) => {
          const Icon = archetype.icon;
          const isSelected = selectedArchetype === archetype.id;
          const isHovered = hoveredArchetype === archetype.id;
          const isAIRecommended = aiRecommendation?.recommendedArchetype === archetype.id;

          return (
            <TooltipProvider key={archetype.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105',
                      isSelected && 'ring-2 ring-primary ring-offset-2 shadow-xl scale-105',
                      isAIRecommended && !isSelected && 'ring-2 ring-blue-400 ring-offset-2 shadow-lg',
                      'h-48 relative overflow-hidden'
                    )}
                    onClick={() => handleArchetypeSelect(archetype.id)}
                    onMouseEnter={() => setHoveredArchetype(archetype.id)}
                    onMouseLeave={() => setHoveredArchetype(null)}
                  >
                    {/* AI Recommendation Badge */}
                    {isAIRecommended && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                          🤖 AI Pick
                        </Badge>
                      </div>
                    )}

                    {/* Gradient Background */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-10',
                      archetype.colorClass
                    )} />

                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className={cn(
                          'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center',
                          archetype.colorClass
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {archetype.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {archetype.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {archetype.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {archetype.traits.slice(0, 3).map(trait => (
                            <Badge key={trait} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4" align="start">
                  <div className="space-y-2">
                    <h4 className="font-semibold">{archetype.name}</h4>
                    <p className="text-sm text-muted-foreground">{archetype.description}</p>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Examples:</div>
                      <div className="text-xs text-muted-foreground">
                        {archetype.examples.slice(0, 3).join(', ')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Target:</div>
                      <div className="text-xs text-muted-foreground">
                        {archetype.target}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Selected Archetype Details */}
      {selectedArchetypeData && (
        <Card className="mt-8 border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center',
                selectedArchetypeData.colorClass
              )}>
                <selectedArchetypeData.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-primary">
                  {selectedArchetypeData.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {selectedArchetypeData.tagline}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Brand Voice & Messaging
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Tone: </span>
                    {selectedArchetypeData.brandVoice.tone.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Key Messages: </span>
                    {selectedArchetypeData.brandVoice.messaging.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Content Style
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Visual Style: </span>
                    {selectedArchetypeData.contentStyle.visualStyle}
                  </div>
                  <div>
                    <span className="font-medium">Content Themes: </span>
                    {selectedArchetypeData.contentStyle.contentThemes.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white/70 rounded-lg">
              <h4 className="font-semibold mb-2">Brand Examples:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedArchetypeData.examples.map(example => (
                  <Badge key={example} variant="outline" className="text-xs">
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedArchetype}
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
