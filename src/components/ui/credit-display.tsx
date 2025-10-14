"use client";

import { useEffect, useState } from 'react';
import { useCredits, UserCredits, MODEL_COSTS, ModelVersion } from '@/hooks/use-credits';
import { useAuth } from '@/hooks/use-auth-supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins, Plus, AlertTriangle, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface CreditDisplayProps {
  variant?: 'sidebar' | 'header' | 'card' | 'dashboard' | 'compact';
  showBuyButton?: boolean;
  showModelBreakdown?: boolean;
  className?: string;
}

export function CreditDisplay({ 
  variant = 'sidebar', 
  showBuyButton = true,
  showModelBreakdown = false,
  className = '' 
}: CreditDisplayProps) {
  const { user } = useAuth();
  const { getCreditBalance, creditBalance } = useCredits();
  const { toast } = useToast();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshCwing] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchCredits = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const creditData = await getCreditBalance();
        if (mounted) setCredits(creditData);
      } catch (error) {
        console.error('Error fetching credits:', error);
        if (mounted) setCredits(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCredits();
    
    return () => {
      mounted = false;
    };
  }, [user]);

  // Use hook state or local state
  const currentCredits = creditBalance || credits;

  const handleRefreshCw = async () => {
    setRefreshCwing(true);
    try {
      const updatedCredits = await getCreditBalance();
      setCredits(updatedCredits);
      toast({
        title: 'Credits Updated',
        description: 'Credit balance has been refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh credit balance',
        variant: 'destructive',
      });
    } finally {
      setRefreshCwing(false);
    }
  };

  if (!user || loading) {
    return null;
  }

  const remaining_credits = currentCredits?.remaining_credits ?? 0;
  const total_credits = currentCredits?.total_credits ?? 0;
  const used_credits = currentCredits?.used_credits ?? 0;
  const isLowCredits = remaining_credits < 10;
  const usagePercentage = total_credits > 0 ? Math.round((used_credits / total_credits) * 100) : 0;

  // Dashboard variant with full breakdown
  if (variant === 'dashboard') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Main Credit Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total_credits}</div>
              <p className="text-xs text-muted-foreground">
                All-time purchased credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {remaining_credits}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{used_credits}</div>
              <p className="text-xs text-muted-foreground">
                Credits consumed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshCw}
                disabled={refreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usagePercentage}%</div>
              <Progress value={usagePercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Model-Specific Breakdown */}
        {showModelBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Generations Available by Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {(Object.entries(MODEL_COSTS) as [ModelVersion, number][]).map(([model, cost]) => {
                  const generationsAvailable = Math.floor(remaining_credits / cost);
                  const canAfford = generationsAvailable > 0;
                  
                  return (
                    <div key={model} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          model === 'revo-1.0' ? 'bg-blue-500' :
                          model === 'revo-1.5' ? 'bg-purple-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">
                            {model === 'revo-1.0' ? 'Revo 1.0' :
                             model === 'revo-1.5' ? 'Revo 1.5' :
                             'Revo 2.0'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cost} credits each
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={canAfford ? "default" : "secondary"}>
                          {generationsAvailable} generations
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Credits Warning */}
        {isLowCredits && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">Low Credits Warning</p>
                  <p className="text-sm text-orange-700">
                    You have {remaining_credits} credits remaining. 
                    Consider purchasing more to continue using our services.
                  </p>
                </div>
                {showBuyButton && (
                  <Link href="/pricing">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-2">
                      <Plus className="h-4 w-4" />
                      Buy Credits
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Compact variant for small spaces
  if (variant === 'compact') {
    return (
      <Card className={`${className} ${isLowCredits ? 'border-orange-200 bg-orange-50' : ''}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">
                {remaining_credits}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshCw}
                disabled={refreshing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {isLowCredits && showBuyButton && (
            <div className="mt-2 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-700">Low credits</span>
              <Link href="/pricing">
                <Button size="sm" className="h-5 text-xs">
                  Buy More
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className={`h-5 w-5 ${isLowCredits ? 'text-orange-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Credits</p>
                <p className="text-2xl font-bold">
                  {remaining_credits?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showBuyButton && (
                <Link href="/pricing">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Buy
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshCw}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {isLowCredits && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-xs">Low credits remaining</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <Coins className={`h-4 w-4 ${isLowCredits ? 'text-orange-500' : 'text-green-500'}`} />
          <Badge variant={isLowCredits ? 'destructive' : 'secondary'}>
            {remaining_credits?.toLocaleString() || '0'} credits
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshCw}
          disabled={refreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
        {showBuyButton && (
          <Link href="/pricing">
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Default sidebar variant
  return (
    <div className={`p-3 border rounded-lg ${isLowCredits ? 'border-orange-200 bg-orange-50' : 'border-gray-200'} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Coins className={`h-4 w-4 ${isLowCredits ? 'text-orange-600' : 'text-green-600'}`} />
          <div>
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="font-medium">
              {remaining_credits?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshCw}
            disabled={refreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCwCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          {showBuyButton && (
            <Link href="/pricing">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
      {isLowCredits && (
        <div className="mt-2 flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3 text-orange-600" />
          <p className="text-xs text-orange-600">Running low</p>
        </div>
      )}
    </div>
  );
}

// Component for showing model-specific credit cost before actions
interface CreditCostDisplayProps {
  modelVersion: ModelVersion;
  feature?: string;
  className?: string;
}

export function CreditCostDisplay({ modelVersion, feature, className = '' }: CreditCostDisplayProps) {
  const cost = MODEL_COSTS[modelVersion];
  const modelName = {
    'revo-1.0': 'Revo 1.0',
    'revo-1.5': 'Revo 1.5', 
    'revo-2.0': 'Revo 2.0',
  }[modelVersion];

  return (
    <div className={`inline-flex items-center space-x-1 text-xs text-muted-foreground ${className}`}>
      <Coins className="h-3 w-3" />
      <span>{cost} credit{cost !== 1 ? 's' : ''}</span>
      <span>•</span>
      <span>{modelName}</span>
      {feature && (
        <>
          <span>•</span>
          <span>{feature}</span>
        </>
      )}
    </div>
  );
}

// Helper component for model selection with credit costs
interface ModelSelectorProps {
  selectedModel: ModelVersion;
  onModelChange: (model: ModelVersion) => void;
  userCredits: UserCredits | null;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, userCredits, className = '' }: ModelSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm font-medium">Select AI Model</p>
      <div className="grid gap-2">
        {(Object.entries(MODEL_COSTS) as [ModelVersion, number][]).map(([model, cost]) => {
          const canAfford = (userCredits?.remaining_credits || 0) >= cost;
          const modelName = {
            'revo-1.0': 'Revo 1.0',
            'revo-1.5': 'Revo 1.5',
            'revo-2.0': 'Revo 2.0',
          }[model];
          
          return (
            <button
              key={model}
              onClick={() => canAfford && onModelChange(model)}
              disabled={!canAfford}
              className={`p-3 border rounded-lg text-left transition-colors ${
                selectedModel === model
                  ? 'border-primary bg-primary/5'
                  : canAfford
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${!canAfford ? 'text-gray-400' : ''}`}>
                    {modelName}
                  </p>
                  <p className={`text-xs ${!canAfford ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    {cost} credits per generation
                  </p>
                </div>
                {!canAfford && (
                  <Badge variant="secondary" className="text-xs">
                    Insufficient Credits
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}