"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Target, 
  Calendar,
  Activity,
  Cpu,
  Sparkles,
  Coins
} from 'lucide-react';

interface ModelStats {
  generations: number;
  total_credits: number;
  success_rate: number;
  avg_credits: number;
}

interface CreditAnalytics {
  total_generations: number;
  by_model: Record<string, ModelStats>;
  by_date: Record<string, { generations: number; credits_used: number }>;
  recent_activity: Array<{
    model_version: string;
    credits_used: number;
    feature: string;
    created_at: string;
    result_success: boolean;
  }>;
}

interface CreditAnalyticsProps {
  userId?: string;
}

const MODEL_INFO = {
  'revo-1.0': { 
    name: 'Revo 1.0', 
    cost: 2, 
    icon: '🚀', 
    description: 'Fast & Efficient',
    color: 'bg-blue-500'
  },
  'revo-1.5': { 
    name: 'Revo 1.5', 
    cost: 3, 
    icon: '⚡', 
    description: 'Balanced Performance',
    color: 'bg-purple-500'
  },
  'revo-2.0': { 
    name: 'Revo 2.0', 
    cost: 4, 
    icon: '🎯', 
    description: 'Premium Quality',
    color: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
};

export function CreditAnalytics({ userId }: CreditAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CreditAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/credit-analytics?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalCreditsUsed = Object.values(analytics.by_model).reduce(
    (sum, model) => sum + model.total_credits, 0
  );

  const mostUsedModel = Object.entries(analytics.by_model).reduce(
    (max, [model, stats]) => 
      stats.generations > (analytics.by_model[max]?.generations || 0) ? model : max,
    Object.keys(analytics.by_model)[0] || ''
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div className="text-sm font-medium text-gray-500">Total Generations</div>
            </div>
            <div className="text-2xl font-bold">{analytics.total_generations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-green-500" />
              <div className="text-sm font-medium text-gray-500">Credits Used</div>
            </div>
            <div className="text-2xl font-bold">{totalCreditsUsed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div className="text-sm font-medium text-gray-500">Most Used Model</div>
            </div>
            <div className="text-xl font-bold">
              {MODEL_INFO[mostUsedModel as keyof typeof MODEL_INFO]?.name || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div className="text-sm font-medium text-gray-500">Avg Per Generation</div>
            </div>
            <div className="text-2xl font-bold">
              {analytics.total_generations > 0 
                ? (totalCreditsUsed / analytics.total_generations).toFixed(1)
                : '0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model-Specific Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(analytics.by_model).map(([modelVersion, stats]) => {
          const modelInfo = MODEL_INFO[modelVersion as keyof typeof MODEL_INFO];
          if (!modelInfo) return null;

          const efficiency = stats.generations > 0 
            ? ((stats.success_rate / 100) * (modelInfo.cost / stats.avg_credits)) * 100
            : 0;

          return (
            <Card key={modelVersion} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${modelInfo.color}`} />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{modelInfo.icon}</span>
                    <div>
                      <div className="font-bold">{modelInfo.name}</div>
                      <div className="text-sm font-normal text-gray-500">
                        {modelInfo.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {stats.generations} uses
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Credits Used</div>
                    <div className="text-xl font-bold text-blue-600">
                      {stats.total_credits}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Success Rate</div>
                    <div className="text-xl font-bold text-green-600">
                      {stats.success_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Average Credits</span>
                    <span className="font-medium">{stats.avg_credits.toFixed(1)}</span>
                  </div>
                  <Progress 
                    value={Math.min((stats.avg_credits / 5) * 100, 100)} 
                    className="h-2"
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Cost per generation: {modelInfo.cost} credits</span>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Efficiency: {efficiency.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recent_activity.slice(0, 10).map((activity, index) => {
              const modelInfo = MODEL_INFO[activity.model_version as keyof typeof MODEL_INFO];
              return (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{modelInfo?.icon || '🤖'}</span>
                    <div>
                      <div className="font-medium">{modelInfo?.name || activity.model_version}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {activity.feature.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{activity.credits_used} credits</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                    <Badge 
                      variant={activity.result_success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {activity.result_success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreditAnalytics;