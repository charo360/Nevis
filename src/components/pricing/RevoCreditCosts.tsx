'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, Crown } from 'lucide-react';
import { revoCreditCosts } from '@/lib/pricing-data';

interface RevoCreditCostsProps {
  compact?: boolean;
  showTitle?: boolean;
}

export function RevoCreditCosts({ compact = false, showTitle = true }: RevoCreditCostsProps) {
  const revoVersions = [
    {
      version: 'revo-1.0',
      name: 'Revo 1.0',
      description: 'Basic AI generation',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-blue-500',
      credits: revoCreditCosts['revo-1.0']
    },
    {
      version: 'revo-1.5',
      name: 'Revo 1.5',
      description: 'Enhanced AI with better quality',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-purple-500',
      credits: revoCreditCosts['revo-1.5']
    },
    {
      version: 'revo-2.0',
      name: 'Revo 2.0',
      description: 'Latest AI with premium features',
      icon: <Crown className="w-5 h-5" />,
      color: 'bg-gold-500',
      credits: revoCreditCosts['revo-2.0']
    }
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {showTitle && (
          <h4 className="font-semibold text-sm text-gray-700">Credit Costs by AI Model:</h4>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          {revoVersions.map((revo) => (
            <div key={revo.version} className="p-2 border rounded-lg">
              <div className="flex items-center justify-center mb-1">
                {revo.icon}
              </div>
              <div className="text-xs font-medium">{revo.name}</div>
              <div className="text-sm font-bold text-blue-600">{revo.credits} credits</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">AI Model Credit Costs</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {revoVersions.map((revo) => (
          <div key={revo.version} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${revo.color} text-white`}>
                {revo.icon}
              </div>
              <div>
                <div className="font-semibold">{revo.name}</div>
                <div className="text-sm text-gray-600">{revo.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">{revo.credits}</div>
              <div className="text-sm text-gray-500">credits</div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Higher versions use more credits but provide better quality, 
            more features, and enhanced AI capabilities.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for showing credit cost in generation UI
export function RevoVersionSelector({ 
  selectedVersion, 
  onVersionChange, 
  userCredits 
}: { 
  selectedVersion: string; 
  onVersionChange: (version: string) => void;
  userCredits: number;
}) {
  const revoVersions = [
    {
      version: 'revo-1.0',
      name: 'Revo 1.0',
      description: 'Basic AI',
      icon: <Zap className="w-4 h-4" />,
      credits: revoCreditCosts['revo-1.0']
    },
    {
      version: 'revo-1.5',
      name: 'Revo 1.5',
      description: 'Enhanced AI',
      icon: <Sparkles className="w-4 h-4" />,
      credits: revoCreditCosts['revo-1.5']
    },
    {
      version: 'revo-2.0',
      name: 'Revo 2.0',
      description: 'Premium AI',
      icon: <Crown className="w-4 h-4" />,
      credits: revoCreditCosts['revo-2.0']
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Select AI Model:</h4>
      <div className="grid grid-cols-1 gap-2">
        {revoVersions.map((revo) => {
          const canAfford = userCredits >= revo.credits;
          const isSelected = selectedVersion === revo.version;
          
          return (
            <button
              key={revo.version}
              onClick={() => canAfford && onVersionChange(revo.version)}
              disabled={!canAfford}
              className={`p-3 border rounded-lg text-left transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : canAfford 
                    ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm' 
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {revo.icon}
                  <div>
                    <div className="font-medium text-sm">{revo.name}</div>
                    <div className="text-xs text-gray-600">{revo.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${canAfford ? 'text-blue-600' : 'text-gray-400'}`}>
                    {revo.credits} credits
                  </div>
                  {!canAfford && (
                    <Badge variant="destructive" className="text-xs">
                      Insufficient
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="text-xs text-gray-500">
        Your balance: {userCredits} credits
      </div>
    </div>
  );
}
