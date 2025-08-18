'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Plus, AlertCircle } from 'lucide-react';
import { getUserCredits, type UserCredits } from '@/app/actions/pricing-actions';
import Link from 'next/link';

interface CreditsDisplayProps {
  userId: string;
  showBuyButton?: boolean;
  compact?: boolean;
}

export function CreditsDisplay({ userId, showBuyButton = true, compact = false }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        setLoading(true);
        const userCredits = await getUserCredits(userId);
        setCredits(userCredits);
        setError(null);
      } catch (err) {
        setError('Failed to load credits');
        console.error('Credits fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 animate-pulse" />
            <span className="text-sm text-gray-500">Loading credits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !credits) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error || 'Credits unavailable'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = credits.totalCredits > 0 
    ? (credits.usedCredits / credits.totalCredits) * 100 
    : 0;

  const isLowCredits = credits.remainingCredits <= 5;
  const isOutOfCredits = credits.remainingCredits === 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Coins className={`w-5 h-5 ${isLowCredits ? 'text-orange-500' : 'text-blue-500'}`} />
          <span className="font-semibold">
            {credits.remainingCredits}
          </span>
          <span className="text-sm text-gray-500">credits</span>
        </div>
        
        {isLowCredits && showBuyButton && (
          <Link href="/pricing">
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Buy More
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Coins className={`w-5 h-5 ${isLowCredits ? 'text-orange-500' : 'text-blue-500'}`} />
          <span>Your Credits</span>
          {isLowCredits && (
            <Badge variant="destructive" className="ml-2">
              {isOutOfCredits ? 'Out of Credits' : 'Low Credits'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Credits Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{credits.remainingCredits}</div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{credits.usedCredits}</div>
            <div className="text-sm text-gray-500">Used</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{credits.totalCredits}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>

        {/* Usage Progress */}
        {credits.totalCredits > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usagePercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Action Buttons */}
        {showBuyButton && (
          <div className="space-y-2">
            <Link href="/pricing" className="w-full">
              <Button className="w-full" variant={isLowCredits ? "default" : "outline"}>
                <Plus className="w-4 h-4 mr-2" />
                {isOutOfCredits ? 'Buy Credits Now' : 'Buy More Credits'}
              </Button>
            </Link>
            
            {isOutOfCredits && (
              <p className="text-sm text-center text-gray-600">
                You need credits to generate new content
              </p>
            )}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-400 text-center">
          Last updated: {credits.lastUpdated.toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified version for navbar/header
export function CreditsIndicator({ userId }: { userId: string }) {
  const [credits, setCredits] = useState<UserCredits | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const userCredits = await getUserCredits(userId);
        setCredits(userCredits);
      } catch (err) {
        console.error('Credits fetch error:', err);
      }
    }

    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  if (!credits) {
    return (
      <div className="flex items-center space-x-1 text-gray-500">
        <Coins className="w-4 h-4" />
        <span className="text-sm">--</span>
      </div>
    );
  }

  const isLowCredits = credits.remainingCredits <= 5;

  return (
    <Link href="/pricing" className="flex items-center space-x-1 hover:opacity-80">
      <Coins className={`w-4 h-4 ${isLowCredits ? 'text-orange-500' : 'text-blue-500'}`} />
      <span className={`text-sm font-medium ${isLowCredits ? 'text-orange-600' : 'text-gray-700'}`}>
        {credits.remainingCredits}
      </span>
    </Link>
  );
}
