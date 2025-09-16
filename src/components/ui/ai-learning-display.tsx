// src/components/ui/ai-learning-display.tsx
"use client";

import * as React from 'react';
import { 
  Brain,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  BarChart3,
  Users,
  Eye,
  Heart,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Progress } from './progress';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface LearningMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  icon: React.ElementType;
  description: string;
}

interface AILearningDisplayProps {
  brandId?: string;
  userId?: string;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

/**
 * AI Learning Display Component
 * Shows how the AI is continuously learning and improving from user interactions
 */
export function AILearningDisplay({ 
  brandId, 
  userId, 
  compact = false, 
  showDetails = true,
  className = ''
}: AILearningDisplayProps) {
  const [learningData, setLearningData] = React.useState<{
    totalInteractions: number;
    learningScore: number;
    improvementRate: number;
    lastUpdated: Date;
    metrics: LearningMetric[];
    insights: string[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadLearningData();
  }, [brandId, userId]);

  const loadLearningData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading AI learning data
      // In a real implementation, this would fetch from your analytics/learning service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        totalInteractions: 1247,
        learningScore: 87,
        improvementRate: 12.5,
        lastUpdated: new Date(),
        metrics: [
          {
            id: 'engagement',
            name: 'Engagement Rate',
            value: 4.2,
            previousValue: 3.8,
            change: 0.4,
            changePercent: 10.5,
            icon: Heart,
            description: 'Average engagement rate of AI-generated content'
          },
          {
            id: 'reach',
            name: 'Content Reach',
            value: 2847,
            previousValue: 2341,
            change: 506,
            changePercent: 21.6,
            icon: Eye,
            description: 'Average reach per post improved through AI optimization'
          },
          {
            id: 'brand_consistency',
            name: 'Brand Consistency',
            value: 94,
            previousValue: 89,
            change: 5,
            changePercent: 5.6,
            icon: Target,
            description: 'AI brand alignment accuracy score'
          },
          {
            id: 'trend_accuracy',
            name: 'Trend Accuracy',
            value: 78,
            previousValue: 71,
            change: 7,
            changePercent: 9.9,
            icon: TrendingUp,
            description: 'Accuracy in predicting trending content performance'
          }
        ],
        insights: [
          'AI learned that your audience engages 23% more with behind-the-scenes content',
          'Optimal posting time shifted to 6 PM based on engagement patterns',
          'Brand voice recognition improved by 15% through feedback learning',
          'Content performance prediction accuracy increased to 87%'
        ]
      };

      setLearningData(mockData);
    } catch (error) {
      console.error('Failed to load AI learning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">AI Learning Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!learningData) {
    return null;
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {learningData.learningScore}% Smart
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      +{learningData.improvementRate}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI improvement rate this month</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Learning Progress</CardTitle>
          </div>
          <Badge variant="secondary">
            {learningData.totalInteractions.toLocaleString()} interactions
          </Badge>
        </div>
        <CardDescription>
          Your AI agent continuously learns from performance data and user feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Learning Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Intelligence Score</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {learningData.learningScore}%
              </span>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                +{learningData.improvementRate}%
              </div>
            </div>
          </div>
          <Progress 
            value={learningData.learningScore} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            Updated {learningData.lastUpdated.toLocaleDateString()}
          </p>
        </div>

        {/* Learning Metrics */}
        {showDetails && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Learning Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningData.metrics.map((metric) => {
                const Icon = metric.icon;
                const isPositive = metric.change > 0;
                
                return (
                  <div
                    key={metric.id}
                    className="p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{metric.name}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${!isPositive && 'rotate-180'}`} />
                        {isPositive ? '+' : ''}{metric.changePercent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {typeof metric.value === 'number' && metric.value > 100 
                          ? metric.value.toLocaleString()
                          : `${metric.value}${metric.id.includes('rate') || metric.id.includes('accuracy') || metric.id.includes('consistency') ? '%' : ''}`
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        was {typeof metric.previousValue === 'number' && metric.previousValue > 100 
                          ? metric.previousValue.toLocaleString()
                          : `${metric.previousValue}${metric.id.includes('rate') || metric.id.includes('accuracy') || metric.id.includes('consistency') ? '%' : ''}`
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {showDetails && learningData.insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Recent AI Insights</h4>
            </div>
            <div className="space-y-2">
              {learningData.insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-blue-50 rounded-md text-sm"
                >
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-900">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2"
            onClick={loadLearningData}
          >
            <BarChart3 className="h-4 w-4" />
            View Detailed Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboard widgets
 */
export function AILearningWidget(props: Omit<AILearningDisplayProps, 'compact'>) {
  return <AILearningDisplay {...props} compact={true} />;
}
