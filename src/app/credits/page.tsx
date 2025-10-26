"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Package,
  History,
  Plus,
  Zap,
  Target,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { CreditAnalytics } from '@/components/ui/credit-analytics';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { DesktopSidebarTrigger } from '@/components/layout/desktop-sidebar-trigger';

// Types
interface UserCredits {
  total_credits: number;
  remaining_credits: number;
  used_credits: number;
  last_payment_at: string | null;
}

interface PaymentTransaction {
  id: string;
  plan_id: string;
  amount: number;
  status: string;
  credits_added: number;
  created_at: string;
  stripe_session_id: string;
}

interface CreditUsage {
  id: string;
  date: string;
  credits_used: number;
  feature: string;
  model_version: string;
  model_cost: number;
  generation_type: string;
  user_id: string;
}

interface ModelUsageStats {
  revo_1_0: { count: number; total_cost: number };
  revo_1_5: { count: number; total_cost: number };
  revo_2_0: { count: number; total_cost: number };
}

// Model cost configuration
const MODEL_COSTS = {
  'revo-1.0': 2,
  'revo-1.5': 3,
  'revo-2.0': 4,
} as const;

// Utility function to get model display name
const getModelDisplayName = (modelVersion: string): string => {
  const names = {
    'revo-1.0': 'Revo 1.0',
    'revo-1.5': 'Revo 1.5', 
    'revo-2.0': 'Revo 2.0',
  };
  return names[modelVersion as keyof typeof names] || modelVersion;
};

// Utility function to get model cost
const getModelCost = (modelVersion: string): number => {
  return MODEL_COSTS[modelVersion as keyof typeof MODEL_COSTS] || 0;
};

export default function CreditManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([]);
  const [modelStats, setModelStats] = useState<ModelUsageStats | null>(null);
  const [loading, setLoading] = useState(true); // Only for initial load
  const [refreshing, setRefreshing] = useState(false); // For background refreshes
  const [error, setError] = useState<string | null>(null);
  // Removed refreshTrigger state; refresh will be handled by direct fetch

  // Fetch user credit data
  const fetchCreditData = useCallback(
    async (isInitial = false) => {
      if (!user && !authLoading) {
        setLoading(false);
        setRefreshing(false);
        setError('Please sign in to view your credit information.');
        return;
      }
      if (!user) {
        // Still loading auth, don't proceed yet
        return;
      }
      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        };
        const creditsResponse = await fetch(`/api/user/credits?t=${Date.now()}`, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store',
        });
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          // If the API returns null/undefined, fallback to 10 credits for new users
          setUserCredits(creditsData && typeof creditsData.total_credits === 'number' ? creditsData : {
            total_credits: 10,
            remaining_credits: 10,
            used_credits: 0,
            last_payment_at: null
          });
        } else {
          setUserCredits({
            total_credits: 10,
            remaining_credits: 10,
            used_credits: 0,
            last_payment_at: null
          });
        }
        const transactionsResponse = await fetch(`/api/user/payment-history?t=${Date.now()}`, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store',
        });
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData || []);
        }
        const usageResponse = await fetch(`/api/user/credit-usage?t=${Date.now()}`, {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store',
        });
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setCreditUsage(usageData || []);
          const stats: ModelUsageStats = {
            revo_1_0: { count: 0, total_cost: 0 },
            revo_1_5: { count: 0, total_cost: 0 },
            revo_2_0: { count: 0, total_cost: 0 },
          };
          usageData?.forEach((usage: CreditUsage) => {
            switch (usage.model_version) {
              case 'revo-1.0':
                stats.revo_1_0.count++;
                stats.revo_1_0.total_cost += usage.credits_used;
                break;
              case 'revo-1.5':
                stats.revo_1_5.count++;
                stats.revo_1_5.total_cost += usage.credits_used;
                break;
              case 'revo-2.0':
                stats.revo_2_0.count++;
                stats.revo_2_0.total_cost += usage.credits_used;
                break;
            }
          });
          setModelStats(stats);
        }
      } catch (error) {
        console.error('Error fetching credit data:', error);
        setError('Failed to load credit information. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, authLoading]
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchCreditData(true); // Only once when user is ready
    }
  }, [authLoading, user]);

  // Manual refresh function (call after purchases or usage)
  const refreshCreditData = () => {
    fetchCreditData(true);
  };

  // Calculate credit usage percentage
  const usagePercentage = userCredits 
    ? Math.round(((userCredits.used_credits || 0) / (userCredits.total_credits || 1)) * 100)
    : 0;

  // Get plan name from plan_id
  const getPlanName = (planId: string) => {
    const planNames = {
      'starter': 'Starter Plan',
      'pro': 'Pro Plan', 
      'enterprise': 'Enterprise Plan'
    };
    return planNames[planId as keyof typeof planNames] || planId;
  };

  // Get plan details
  const getPlanDetails = (planId: string) => {
    const plans = {
      'starter': { name: 'Starter', credits: 40, price: 9.99, color: 'bg-blue-500' },
      'pro': { name: 'Pro', credits: 250, price: 59.99, color: 'bg-purple-500' },
      'enterprise': { name: 'Enterprise', credits: 1000, price: 199.99, color: 'bg-green-500' }
    };
    return plans[planId as keyof typeof plans] || { name: planId, credits: 0, price: 0, color: 'bg-gray-500' };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show error at the top of the page, but always render the main content
  // If user is not authenticated after loading is complete, show error
  const showError = error && !error.includes('sign in');
  const showSignIn = error && error.includes('sign in');

  return (
    <>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Error Banner */}
      {showError && (
        <div className="mb-4">
          <Card className="w-full max-w-md mx-auto border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
              <Button 
                onClick={() => fetchCreditData(true)} 
                className="w-full mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {showSignIn && (
        <div className="mb-4">
          <Card className="w-full max-w-md mx-auto border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>Please sign in to view your credit information.</p>
              </div>
              <Link href="/auth">
                <Button className="w-full mt-4">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Subtle background refresh indicator */}
      {refreshing && (
        <div className="fixed top-0 right-0 m-4 text-xs text-gray-500 z-50 bg-white/80 px-3 py-1 rounded shadow">
          Refreshing credits...
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Management</h1>
          <p className="text-muted-foreground">
            Track your credits, usage, and purchase history
          </p>
        </div>
        <Link href="/pricing">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Buy More Credits
          </Button>
        </Link>
      </div>

  {/* Credit Overview Cards */}
  {/* Show skeletons if loading, else show data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="bg-gray-200 rounded w-16 h-6 inline-block animate-pulse" /> : (userCredits?.total_credits || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time purchased credits
            </p>
          </CardContent>
        </Card>
        {/* Remaining Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? <span className="bg-gray-200 rounded w-16 h-6 inline-block animate-pulse" /> : (userCredits?.remaining_credits || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for use
            </p>
          </CardContent>
        </Card>
        {/* Used Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="bg-gray-200 rounded w-16 h-6 inline-block animate-pulse" /> : (userCredits?.used_credits || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits consumed
            </p>
          </CardContent>
        </Card>
        {/* Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="bg-gray-200 rounded w-12 h-6 inline-block animate-pulse" /> : `${usagePercentage}%`}
            </div>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Credit Usage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Available Credits</span>
                    <span className="font-medium text-green-600">
                      {userCredits?.remaining_credits || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Used Credits</span>
                    <span className="font-medium">
                      {userCredits?.used_credits || 0}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Credits</span>
                      <span>{userCredits?.total_credits || 0}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={usagePercentage} 
                    className="mt-4"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {usagePercentage}% of credits used
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userCredits?.last_payment_at ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Last Purchase</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(userCredits.last_payment_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <Badge variant="secondary" className="text-green-600">
                        Active
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No purchase history yet</p>
                    <Link href="/pricing">
                      <Button size="sm" className="mt-2">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Low Credits Warning */}
          {userCredits && userCredits.remaining_credits < 10 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-800">Low Credits Warning</p>
                    <p className="text-sm text-orange-700">
                      You have {userCredits.remaining_credits} credits remaining. 
                      Consider purchasing more to continue using our services.
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Buy Credits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <CreditAnalytics />
        </TabsContent>

        {/* Purchase History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => {
                    const plan = getPlanDetails(transaction.plan_id);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${plan.color}`}></div>
                          <div>
                            <p className="font-medium">{getPlanName(transaction.plan_id)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">+{transaction.credits_added} credits</p>
                          <p className="text-sm text-muted-foreground">${transaction.amount}</p>
                          <Badge 
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                            className={transaction.status === 'completed' ? 'bg-green-600' : ''}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No purchase history yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your credit purchases will appear here
                  </p>
                  <Link href="/pricing">
                    <Button className="mt-4">
                      Buy Your First Credits
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { id: 'starter', name: 'Starter', credits: 40, price: 9.99, popular: false },
              { id: 'pro', name: 'Pro', credits: 250, price: 59.99, popular: true },
              { id: 'enterprise', name: 'Enterprise', credits: 1000, price: 199.99, popular: false }
            ].map((plan) => (
              <Card key={plan.id} className={plan.popular ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.popular && (
                      <Badge className="bg-primary">Most Popular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold">${plan.price}</p>
                      <p className="text-sm text-muted-foreground">One-time purchase</p>
                    </div>
                    <div>
                      <p className="font-medium">{plan.credits} Credits</p>
                      <p className="text-sm text-muted-foreground">
                        ${(plan.price / plan.credits).toFixed(3)} per credit
                      </p>
                    </div>
                    <Link href={`/pricing?plan=${plan.id}`}>
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                        Purchase {plan.name}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}