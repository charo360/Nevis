"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Zap, 
  CreditCard, 
  AlertTriangle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { ModelVersion, getCostForModel } from '@/lib/credit-integration';

interface CreditGateProps {
  modelVersion: ModelVersion;
  userCredits: number;
  feature: string;
  children: React.ReactNode;
  onProceed?: () => void;
}

export function CreditGate({ 
  modelVersion, 
  userCredits, 
  feature, 
  children, 
  onProceed 
}: CreditGateProps) {
  const requiredCredits = getCostForModel(modelVersion);
  const hasEnoughCredits = userCredits >= requiredCredits;

  // Model display information
  const modelInfo = {
    'revo-1.0': { name: 'Revo 1.0', icon: '🚀', description: 'Fast & Efficient' },
    'revo-1.5': { name: 'Revo 1.5', icon: '⚡', description: 'Balanced Performance' },
    'revo-2.0': { name: 'Revo 2.0', icon: '🎯', description: 'Premium Quality' },
  };

  const model = modelInfo[modelVersion];

  if (hasEnoughCredits) {
    return (
      <div className="space-y-4">
        {/* Credit Info Bar */}
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span>
                Using <strong>{model.name}</strong> ({requiredCredits} credits) for {feature}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {userCredits} credits available
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
        
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insufficient Credits Warning */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>
              Insufficient credits for {feature} with <strong>{model.name}</strong>
            </span>
            <Badge variant="destructive">
              Need {requiredCredits}, have {userCredits}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Credit Gate Card */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">Credits Required</CardTitle>
          <p className="text-muted-foreground">
            You need more credits to use {feature} with the selected AI model
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{model.icon}</span>
                <div>
                  <h3 className="font-semibold">{model.name}</h3>
                  <p className="text-sm text-gray-600">{model.description}</p>
                </div>
              </div>
              <Badge variant="outline">
                {requiredCredits} credits
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Feature:</span>
                <span className="ml-2 font-medium capitalize">
                  {feature.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Cost:</span>
                <span className="ml-2 font-medium text-orange-600">
                  {requiredCredits} credits
                </span>
              </div>
            </div>
          </div>

          {/* Credit Balance */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Your Credit Balance</span>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-bold text-lg">{userCredits}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Required:</span>
                <span className="font-medium">{requiredCredits} credits</span>
              </div>
              <div className="flex justify-between">
                <span>Shortfall:</span>
                <span className="font-medium text-red-600">
                  {requiredCredits - userCredits} credits
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button size="lg" className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Buy More Credits
              </Button>
            </Link>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                Get instant access to all AI features by purchasing credits.
              </p>
              <p className="mt-1">
                Prices start from just $9.99 for 40 credits.
              </p>
            </div>
            
            <Link href="/credits" className="block">
              <Button variant="outline" size="sm" className="w-full">
                View Credit Management
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Disabled Content Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Content locked - insufficient credits
            </p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CreditGate;