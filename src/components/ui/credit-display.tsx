"use client";

import { useEffect, useState } from 'react';
import { useCredits } from '@/hooks/use-credits';
import { useAuth } from '@/hooks/use-auth-supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CreditDisplayProps {
  variant?: 'sidebar' | 'header' | 'card';
  showBuyButton?: boolean;
  className?: string;
}

export function CreditDisplay({ 
  variant = 'sidebar', 
  showBuyButton = true,
  className = '' 
}: CreditDisplayProps) {
  const { user } = useAuth();
  const { getCreditBalance } = useCredits();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const creditData = await getCreditBalance();
        setCredits(creditData?.remaining_credits || 0);
      } catch (error) {
        console.error('Error fetching credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user, getCreditBalance]);

  if (!user || loading) {
    return null;
  }

  const isLowCredits = credits !== null && credits < 10;

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
                  {credits !== null ? credits.toLocaleString() : '--'}
                </p>
              </div>
            </div>
            {showBuyButton && (
              <Link href="/pricing">
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Buy
                </Button>
              </Link>
            )}
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
            {credits !== null ? credits.toLocaleString() : '--'} credits
          </Badge>
        </div>
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
              {credits !== null ? credits.toLocaleString() : '--'}
            </p>
          </div>
        </div>
        {showBuyButton && (
          <Link href="/pricing">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        )}
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

// Component for showing credit cost before actions
interface CreditCostDisplayProps {
  cost: number;
  feature: string;
  className?: string;
}

export function CreditCostDisplay({ cost, feature, className = '' }: CreditCostDisplayProps) {
  return (
    <div className={`inline-flex items-center space-x-1 text-xs text-muted-foreground ${className}`}>
      <Coins className="h-3 w-3" />
      <span>{cost} credit{cost !== 1 ? 's' : ''}</span>
      <span>•</span>
      <span>{feature}</span>
    </div>
  );
}