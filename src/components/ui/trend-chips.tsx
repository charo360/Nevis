// src/components/ui/trend-chips.tsx
"use client";

import * as React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Zap, 
  Hash,
  Calendar,
  Globe,
  Target,
  Sparkles,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

export interface TrendingTopic {
  id: string;
  keyword: string;
  category: 'business' | 'social' | 'tech' | 'lifestyle' | 'seasonal' | 'news';
  trendScore: number; // 0-100
  momentum: 'rising' | 'stable' | 'falling';
  relevanceScore: number; // 0-100 how relevant to your brand
  suggestedHashtags: string[];
  contentIdea: string;
  source: string;
  timeframe: string;
}

export interface TrendChipsProps {
  brandProfile?: {
    businessType?: string;
    businessName?: string;
    targetAudience?: string;
    location?: any;
  };
  onTrendSelected?: (trend: TrendingTopic) => void;
  onHashtagsSelected?: (hashtags: string[]) => void;
  compact?: boolean;
  maxTrends?: number;
}

/**
 * Trend Surfacing Service - connects to your existing RSS/trend systems
 */
class TrendSurfacingService {
  static async fetchTrendingTopics(
    businessType?: string, 
    location?: any
  ): Promise<TrendingTopic[]> {
    try {
      // This would integrate with your existing RSS feed service
      // For now, providing smart mock data based on business context
      
      const businessKeywords = this.getBusinessKeywords(businessType);
      const seasonalTrends = this.getSeasonalTrends();
      const globalTrends = this.getGlobalTrends();
      
      return [
        ...businessKeywords,
        ...seasonalTrends,
        ...globalTrends,
      ].slice(0, 12);
    } catch (error) {
      console.warn('Failed to fetch trending topics:', error);
      return this.getFallbackTrends();
    }
  }

  private static getBusinessKeywords(businessType?: string): TrendingTopic[] {
    const type = businessType?.toLowerCase() || 'business';
    
    const businessTrends: Record<string, TrendingTopic[]> = {
      restaurant: [
        {
          id: 'local-ingredients',
          keyword: 'Farm-to-Table',
          category: 'business',
          trendScore: 88,
          momentum: 'rising',
          relevanceScore: 95,
          suggestedHashtags: ['#FarmToTable', '#LocalIngredients', '#SustainableDining'],
          contentIdea: 'Showcase your locally sourced ingredients and sustainable practices',
          source: 'Food & Wine Trends',
          timeframe: 'This week'
        },
        {
          id: 'comfort-food-revival',
          keyword: 'Comfort Food Revival',
          category: 'social',
          trendScore: 76,
          momentum: 'stable',
          relevanceScore: 90,
          suggestedHashtags: ['#ComfortFood', '#ClassicFlavors', '#FoodMemories'],
          contentIdea: 'Share stories behind your comfort food dishes and family recipes',
          source: 'Restaurant Industry Report',
          timeframe: 'This month'
        }
      ],
      technology: [
        {
          id: 'ai-productivity',
          keyword: 'AI Productivity Tools',
          category: 'tech',
          trendScore: 92,
          momentum: 'rising',
          relevanceScore: 88,
          suggestedHashtags: ['#AIProductivity', '#TechEfficiency', '#WorkflowAutomation'],
          contentIdea: 'Demonstrate how AI tools are revolutionizing workplace efficiency',
          source: 'TechCrunch',
          timeframe: 'This week'
        },
        {
          id: 'cybersecurity-awareness',
          keyword: 'Cybersecurity Best Practices',
          category: 'business',
          trendScore: 84,
          momentum: 'rising',
          relevanceScore: 85,
          suggestedHashtags: ['#CyberSecurity', '#DataProtection', '#DigitalSafety'],
          contentIdea: 'Share essential cybersecurity tips for businesses and individuals',
          source: 'Security Week',
          timeframe: 'This month'
        }
      ],
      fitness: [
        {
          id: 'functional-fitness',
          keyword: 'Functional Fitness',
          category: 'lifestyle',
          trendScore: 85,
          momentum: 'rising',
          relevanceScore: 92,
          suggestedHashtags: ['#FunctionalFitness', '#MovementQuality', '#StrengthTraining'],
          contentIdea: 'Show practical exercises that improve daily movement and strength',
          source: 'Fitness Magazine',
          timeframe: 'This week'
        }
      ],
      healthcare: [
        {
          id: 'mental-health-awareness',
          keyword: 'Mental Health Support',
          category: 'lifestyle',
          trendScore: 89,
          momentum: 'stable',
          relevanceScore: 95,
          suggestedHashtags: ['#MentalHealthMatters', '#WellnessSupport', '#SelfCare'],
          contentIdea: 'Share resources and tips for maintaining good mental health',
          source: 'Health Today',
          timeframe: 'Always relevant'
        }
      ]
    };

    return businessTrends[type] || businessTrends['business'] || [];
  }

  private static getSeasonalTrends(): TrendingTopic[] {
    const currentMonth = new Date().getMonth();
    const isWinter = currentMonth >= 11 || currentMonth <= 2;
    const isSpring = currentMonth >= 2 && currentMonth <= 5;
    const isSummer = currentMonth >= 5 && currentMonth <= 8;
    
    if (isWinter) {
      return [{
        id: 'new-year-goals',
        keyword: 'New Year Resolutions',
        category: 'seasonal',
        trendScore: 95,
        momentum: 'rising',
        relevanceScore: 80,
        suggestedHashtags: ['#NewYearGoals', '#FreshStart', '#2024Goals'],
        contentIdea: 'Help your audience achieve their New Year goals with your services',
        source: 'Seasonal Trends',
        timeframe: 'January - February'
      }];
    } else if (isSpring) {
      return [{
        id: 'spring-renewal',
        keyword: 'Spring Renewal',
        category: 'seasonal',
        trendScore: 78,
        momentum: 'rising',
        relevanceScore: 75,
        suggestedHashtags: ['#SpringRenewal', '#FreshBeginnings', '#SpringCleaning'],
        contentIdea: 'Connect your services to themes of renewal and fresh starts',
        source: 'Seasonal Trends',
        timeframe: 'March - May'
      }];
    }
    
    return [];
  }

  private static getGlobalTrends(): TrendingTopic[] {
    return [
      {
        id: 'sustainability-focus',
        keyword: 'Sustainability',
        category: 'social',
        trendScore: 87,
        momentum: 'stable',
        relevanceScore: 70,
        suggestedHashtags: ['#Sustainability', '#EcoFriendly', '#GreenBusiness'],
        contentIdea: 'Highlight your sustainable practices and environmental responsibility',
        source: 'Global Trends Report',
        timeframe: 'Ongoing'
      },
      {
        id: 'community-support',
        keyword: 'Community Support',
        category: 'social',
        trendScore: 82,
        momentum: 'stable',
        relevanceScore: 85,
        suggestedHashtags: ['#CommunitySupport', '#LocalBusiness', '#TogetherWeCan'],
        contentIdea: 'Show how your business supports and engages with the local community',
        source: 'Social Impact Trends',
        timeframe: 'Always relevant'
      }
    ];
  }

  private static getFallbackTrends(): TrendingTopic[] {
    return [
      {
        id: 'fallback-innovation',
        keyword: 'Innovation',
        category: 'business',
        trendScore: 75,
        momentum: 'stable',
        relevanceScore: 80,
        suggestedHashtags: ['#Innovation', '#Progress', '#FutureForward'],
        contentIdea: 'Share innovative approaches in your industry',
        source: 'Business Trends',
        timeframe: 'This month'
      }
    ];
  }
}

export function TrendChips({
  brandProfile,
  onTrendSelected,
  onHashtagsSelected,
  compact = false,
  maxTrends = 6
}: TrendChipsProps) {
  const [trendingTopics, setTrendingTopics] = React.useState<TrendingTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(!compact);
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

  // Load trending topics
  React.useEffect(() => {
    loadTrendingTopics();
  }, [brandProfile?.businessType]);

  const loadTrendingTopics = async () => {
    setLoading(true);
    try {
      const topics = await TrendSurfacingService.fetchTrendingTopics(
        brandProfile?.businessType,
        brandProfile?.location
      );
      setTrendingTopics(topics.slice(0, maxTrends));
      setLastRefresh(new Date());
    } catch (error) {
      console.warn('Failed to load trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendClick = (trend: TrendingTopic) => {
    onTrendSelected?.(trend);
    
    // Also send hashtags if handler is provided
    if (onHashtagsSelected) {
      onHashtagsSelected(trend.suggestedHashtags);
    }
  };

  const getMomentumIcon = (momentum: TrendingTopic['momentum']) => {
    switch (momentum) {
      case 'rising':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'falling':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Target className="h-3 w-3 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'business':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'social':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'tech':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'lifestyle':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'seasonal':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'news':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        {!compact && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Loading Trends...
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded-md w-20"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <>
      <div className="flex flex-wrap gap-2">
        {trendingTopics.map((trend) => (
          <TooltipProvider key={trend.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-auto p-2 gap-2 cursor-pointer transition-all hover:scale-105',
                    getCategoryColor(trend.category)
                  )}
                  onClick={() => handleTrendClick(trend)}
                >
                  {getMomentumIcon(trend.momentum)}
                  <span className="text-xs font-medium">{trend.keyword}</span>
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {trend.trendScore}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" align="start">
                <div className="space-y-2">
                  <div className="font-medium">{trend.keyword}</div>
                  <div className="text-sm text-muted-foreground">
                    {trend.contentIdea}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{trend.source}</span>
                    <span className="text-muted-foreground">{trend.timeframe}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {trend.suggestedHashtags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-muted-foreground">
          Updated {lastRefresh.toLocaleTimeString()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadTrendingTopics}
          className="text-xs h-6 px-2"
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>
    </>
  );

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            Trending Topics
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-3">
            {content}
          </Card>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Trending Topics
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            AI Curated
          </Badge>
        </div>
        <CardDescription>
          Click any trend to incorporate it into your content generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for use in content generation interfaces
 */
export function TrendChipsCompact(props: Omit<TrendChipsProps, 'compact'>) {
  return <TrendChips {...props} compact={true} />;
}
