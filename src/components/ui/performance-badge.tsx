// src/components/ui/performance-badge.tsx
"use client";

import * as React from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Eye, Heart, Loader2 } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import type { PerformancePrediction } from '@/services/performance-prediction-service';

interface PerformanceBadgeProps {
  prediction: PerformancePrediction | null;
  loading?: boolean;
  compact?: boolean;
}

export function PerformanceBadge({ prediction, loading = false, compact = false }: PerformanceBadgeProps) {
  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analyzing...
      </Badge>
    );
  }

  if (!prediction) {
    return (
      <Badge variant="outline" className="gap-1">
        <BarChart3 className="h-3 w-3" />
        No prediction
      </Badge>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-3 w-3" />;
    if (score >= 40) return <Target className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const reachColorClass = getScoreColor(prediction.reachScore);
  const reachIcon = getScoreIcon(prediction.reachScore);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`gap-1 ${reachColorClass}`}>
              {reachIcon}
              {prediction.reachScore}% Reach
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Predicted reach score based on AI analysis</p>
            <p className="text-xs text-muted-foreground">
              {prediction.predictedMetrics.estimatedReach} estimated reach
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="p-1 h-auto">
          <Badge className={`gap-1 ${reachColorClass} hover:opacity-80 cursor-pointer`}>
            {reachIcon}
            {prediction.reachScore}% Reach
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Performance Prediction</CardTitle>
            </div>
            <CardDescription>
              AI-powered analysis based on content quality, trends, and brand consistency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Reach</span>
                </div>
                <div className="text-2xl font-bold text-primary">{prediction.reachScore}%</div>
                <div className="text-xs text-muted-foreground">
                  ~{prediction.predictedMetrics.estimatedReach}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm font-medium">Engagement</span>
                </div>
                <div className="text-2xl font-bold text-pink-500">{prediction.engagementScore}%</div>
                <div className="text-xs text-muted-foreground">
                  ~{prediction.predictedMetrics.estimatedEngagement}
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm font-medium">Confidence Level:</span>
              <Badge 
                variant={prediction.confidenceLevel === 'high' ? 'default' : 
                        prediction.confidenceLevel === 'medium' ? 'secondary' : 'outline'}
              >
                {prediction.confidenceLevel.toUpperCase()}
              </Badge>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Analysis Factors</h4>
              <div className="space-y-2">
                {Object.entries(prediction.factors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            value >= 80 ? 'bg-green-500' :
                            value >= 60 ? 'bg-blue-500' :
                            value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="pt-2 border-t space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Est. Impressions:</span>
                <span className="font-medium">{prediction.predictedMetrics.estimatedImpressions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Lightweight version for displaying in lists
 */
export function PerformanceBadgeCompact({ prediction, loading }: PerformanceBadgeProps) {
  return <PerformanceBadge prediction={prediction} loading={loading} compact={true} />;
}
