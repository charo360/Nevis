'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RevoVersionSelector } from './RevoCreditCosts';
import { validateCreditsForRevo, deductCreditsForRevo, getUserCredits } from '@/app/actions/pricing-actions';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RevoGenerationWrapperProps {
  userId: string;
  onGenerate: (revoVersion: string) => Promise<void>;
  children?: React.ReactNode;
  defaultVersion?: string;
}

export function RevoGenerationWrapper({ 
  userId, 
  onGenerate, 
  children, 
  defaultVersion = 'revo-1.0' 
}: RevoGenerationWrapperProps) {
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditValidation, setCreditValidation] = useState<{
    canAfford: boolean;
    creditsCost: number;
    remainingCredits: number;
  } | null>(null);

  // Load user credits
  useEffect(() => {
    async function loadCredits() {
      try {
        const credits = await getUserCredits(userId);
        setUserCredits(credits.remainingCredits);
      } catch (err) {
      }
    }

    if (userId) {
      loadCredits();
    }
  }, [userId]);

  // Validate credits when version changes
  useEffect(() => {
    async function validateCredits() {
      if (!userId || !selectedVersion) return;

      try {
        const validation = await validateCreditsForRevo(userId, selectedVersion);
        setCreditValidation(validation);
        setError(null);
      } catch (err) {
        setError('Failed to validate credits');
      }
    }

    validateCredits();
  }, [userId, selectedVersion, userCredits]);

  const handleGenerate = async () => {
    if (!creditValidation?.canAfford) {
      setError('Insufficient credits for this AI model');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Deduct credits first
      const deductResult = await deductCreditsForRevo(userId, selectedVersion);
      
      if (!deductResult.success) {
        throw new Error('Failed to deduct credits');
      }

      // Update local credit count
      if (deductResult.remainingCredits !== undefined) {
        setUserCredits(deductResult.remainingCredits);
      }

      // Call the actual generation function
      await onGenerate(selectedVersion);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      
      // TODO: Refund credits if generation failed
      // await refundCredits(userId, creditValidation.creditsCost);
      
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to generate content.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Model Selection */}
      <RevoVersionSelector
        selectedVersion={selectedVersion}
        onVersionChange={setSelectedVersion}
        userCredits={userCredits}
      />

      {/* Credit Status */}
      {creditValidation && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Generation Cost:</span>
            <span className="text-sm font-bold text-blue-600">
              {creditValidation.creditsCost} credits
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">After generation:</span>
            <span className="text-sm text-gray-600">
              {creditValidation.remainingCredits - creditValidation.creditsCost} credits remaining
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Insufficient Credits Warning */}
      {creditValidation && !creditValidation.canAfford && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You need {creditValidation.creditsCost} credits but only have {creditValidation.remainingCredits}.
            </span>
            <Link href="/pricing">
              <Button size="sm" variant="outline">
                Buy Credits
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Content */}
      {children}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={loading || !creditValidation?.canAfford}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            Generate with {selectedVersion.replace('-', ' ').toUpperCase()}
            {creditValidation && (
              <span className="ml-2 text-sm opacity-80">
                ({creditValidation.creditsCost} credits)
              </span>
            )}
          </>
        )}
      </Button>

      {/* Credit Balance */}
      <div className="text-center text-sm text-gray-600">
        Your balance: {userCredits} credits
        {userCredits <= 10 && (
          <Link href="/pricing" className="ml-2 text-blue-600 hover:underline">
            Buy more credits
          </Link>
        )}
      </div>
    </div>
  );
}

// Usage example component
export function ExampleRevoGeneration({ userId }: { userId: string }) {
  const handleGenerate = async (revoVersion: string) => {
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would call your actual generation API
    // const result = await generateContent(revoVersion, prompt);
    
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Generate Content</h3>
      
      <RevoGenerationWrapper
        userId={userId}
        onGenerate={handleGenerate}
        defaultVersion="revo-1.5"
      >
        {/* Custom content can go here */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Select your preferred AI model and generate high-quality content. 
            Higher versions provide better quality but cost more credits.
          </p>
        </div>
      </RevoGenerationWrapper>
    </div>
  );
}
