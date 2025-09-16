// src/app/dashboard/competitor-analysis/page.tsx
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  RefreshCw, 
  Eye,
  Users,
  Calendar,
  Award,
  AlertCircle,
  ExternalLink,
  Zap,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useToast } from '@/hooks/use-toast';

interface CompetitorMetrics {
  name: string;
  website: string;
  industry: string;
  followersCount: number;
  engagementRate: number;
  postFrequency: number; // posts per week
  avgLikes: number;
  avgComments: number;
  topPlatforms: string[];
  contentStrategy: {
    primaryTopics: string[];
    contentTypes: string[];
    postingTimes: string[];
    hashtagStrategy: string[];
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  lastAnalyzed: string;
}

interface CompetitorComparison {
  yourBrand: {
    score: number;
    position: number;
    strengths: string[];
    improvementAreas: string[];
  };
  competitors: CompetitorMetrics[];
  insights: {
    marketTrends: string[];
    contentGaps: string[];
    recommendations: string[];
  };
}

export default function CompetitorAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentBrand } = useUnifiedBrand();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [competitorData, setCompetitorData] = React.useState<CompetitorComparison | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');

  // Redirect if no auth or brand
  React.useEffect(() => {
    if (!user || !currentBrand) {
      router.push('/dashboard');
    }
  }, [user, currentBrand, router]);

  // Load competitor analysis
  React.useEffect(() => {
    if (!currentBrand) return;
    
    loadCompetitorAnalysis();
  }, [currentBrand]);

  const loadCompetitorAnalysis = async () => {
    setIsLoading(true);
    try {
      // Simulate AI competitor analysis (integrate with your existing competitor analysis service)
      const mockData: CompetitorComparison = {
        yourBrand: {
          score: 72,
          position: 3,
          strengths: [
            "Consistent visual branding",
            "High-quality AI-generated content",
            "Good hashtag strategy"
          ],
          improvementAreas: [
            "Post frequency too low",
            "Limited video content",
            "Engagement timing needs optimization"
          ]
        },
        competitors: [
          {
            name: "Industry Leader Co",
            website: "industryleader.com",
            industry: currentBrand.businessType || "Business",
            followersCount: 125000,
            engagementRate: 4.2,
            postFrequency: 12,
            avgLikes: 850,
            avgComments: 45,
            topPlatforms: ["Instagram", "LinkedIn"],
            contentStrategy: {
              primaryTopics: ["Innovation", "Customer Success", "Industry Trends"],
              contentTypes: ["Carousel", "Reels", "Stories"],
              postingTimes: ["9 AM", "1 PM", "6 PM"],
              hashtagStrategy: ["#industryLeader", "#innovation", "#success"]
            },
            strengths: [
              "High engagement rate",
              "Consistent posting schedule",
              "Strong video content"
            ],
            weaknesses: [
              "Generic messaging",
              "Over-promotional content"
            ],
            opportunities: [
              "User-generated content",
              "Behind-the-scenes content"
            ],
            lastAnalyzed: new Date().toISOString()
          },
          {
            name: "Growing Competitor",
            website: "growingcomp.com",
            industry: currentBrand.businessType || "Business",
            followersCount: 45000,
            engagementRate: 6.1,
            postFrequency: 8,
            avgLikes: 380,
            avgComments: 28,
            topPlatforms: ["Instagram", "Twitter"],
            contentStrategy: {
              primaryTopics: ["Tips", "Behind-the-scenes", "Community"],
              contentTypes: ["Single Image", "Carousel", "Stories"],
              postingTimes: ["8 AM", "12 PM", "5 PM"],
              hashtagStrategy: ["#tips", "#community", "#growth"]
            },
            strengths: [
              "Authentic voice",
              "Community engagement",
              "Creative content"
            ],
            weaknesses: [
              "Inconsistent branding",
              "Limited reach"
            ],
            opportunities: [
              "Influencer partnerships",
              "Paid advertising"
            ],
            lastAnalyzed: new Date().toISOString()
          }
        ],
        insights: {
          marketTrends: [
            "Video content driving 2x more engagement",
            "Carousel posts performing 40% better",
            "Story engagement increasing 25% month-over-month"
          ],
          contentGaps: [
            "Missing video content strategy",
            "No user-generated content campaigns",
            "Limited behind-the-scenes content"
          ],
          recommendations: [
            "Increase posting frequency to 10-12 posts/week",
            "Add video content 3x per week",
            "Optimize posting times to 9 AM and 6 PM",
            "Launch user-generated content campaign",
            "Create behind-the-scenes content series"
          ]
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCompetitorData(mockData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not load competitor analysis. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    toast({
      title: "Refreshing Analysis",
      description: "Fetching latest competitor data..."
    });
    await loadCompetitorAnalysis();
  };

  if (!user || !currentBrand) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex-1 w-full space-y-6 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Competitor Analysis</h1>
            <p className="text-muted-foreground">AI-powered competitive intelligence</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!competitorData) {
    return (
      <div className="flex-1 w-full space-y-6 px-6 py-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load your competitor analysis data.
          </p>
          <Button onClick={loadCompetitorAnalysis}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered competitive intelligence for {currentBrand.businessName}
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
        <Button onClick={handleRefreshAnalysis} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {/* Your Brand Performance Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Your Brand Performance
              </CardTitle>
              <CardDescription>Overall competitive position</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                #{competitorData.yourBrand.position}
              </div>
              <div className="text-sm text-muted-foreground">Market Position</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Competitive Score</span>
                <span className="text-2xl font-bold text-primary">
                  {competitorData.yourBrand.score}/100
                </span>
              </div>
              <Progress value={competitorData.yourBrand.score} className="mb-4" />
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                  <div className="space-y-1">
                    {competitorData.yourBrand.strengths.map((strength, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-orange-600 mb-3">Improvement Areas</h4>
              <div className="space-y-2">
                {competitorData.yourBrand.improvementAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Target className="h-3 w-3 text-orange-500 mt-1 flex-shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Analysis Tabs */}
      <Tabs defaultValue="competitors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {competitorData.competitors.map((competitor, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {competitor.name}
                        {index === 0 && <Badge variant="secondary">Leader</Badge>}
                        {index === 1 && <Badge variant="outline">Rising</Badge>}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <ExternalLink className="h-3 w-3" />
                        {competitor.website}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {competitor.engagementRate.toFixed(1)}% engagement
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">
                        {competitor.followersCount >= 1000 
                          ? `${(competitor.followersCount / 1000).toFixed(1)}K`
                          : competitor.followersCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posts/Week</span>
                      <span className="font-medium">{competitor.postFrequency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg Likes</span>
                      <span className="font-medium">{competitor.avgLikes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg Comments</span>
                      <span className="font-medium">{competitor.avgComments}</span>
                    </div>
                  </div>

                  {/* Top Platforms */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">TOP PLATFORMS</h5>
                    <div className="flex gap-1">
                      {competitor.topPlatforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Content Strategy Highlights */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">CONTENT FOCUS</h5>
                    <div className="flex flex-wrap gap-1">
                      {competitor.contentStrategy.primaryTopics.slice(0, 3).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Quick Wins */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">OPPORTUNITIES</h5>
                    <div className="space-y-1">
                      {competitor.opportunities.slice(0, 2).map((opp, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Market Trends
                </CardTitle>
                <CardDescription>What's working in your industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitorData.insights.marketTrends.map((trend, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{trend}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Content Gaps
                </CardTitle>
                <CardDescription>Opportunities your competitors are missing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitorData.insights.contentGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Personalized action plan to outperform your competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorData.insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="h-6 w-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
