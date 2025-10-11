"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditGate } from '@/components/ui/credit-gate';
import { useCredits, type ModelVersion } from '@/hooks/use-credits';
import { useAuth } from '@/hooks/use-auth-supabase';
import { creditAwareContentService } from '@/ai/models/services/credit-aware-content-service';
import type { RevoModelId } from '@/ai/models/types/model-types';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Info
} from 'lucide-react';

interface ContentGenerationExampleProps {
  onContentGenerated?: (content: any) => void;
}

export function ContentGenerationExample({ onContentGenerated }: ContentGenerationExampleProps) {
  const { user } = useAuth();
  const { 
    creditBalance, 
    hasEnoughCreditsForModel, 
    getCostForModel,
    getCurrentBalance 
  } = useCredits();

  const [selectedModel, setSelectedModel] = useState<ModelVersion>('revo-1.0');
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);

  // Model information
  const modelOptions = [
    { 
      value: 'revo-1.0' as ModelVersion, 
      label: 'Revo 1.0 - Fast & Efficient', 
      cost: 2,
      description: 'Quick generations with good quality'
    },
    { 
      value: 'revo-1.5' as ModelVersion, 
      label: 'Revo 1.5 - Balanced Performance', 
      cost: 3,
      description: 'Balanced speed and quality'
    },
    { 
      value: 'revo-2.0' as ModelVersion, 
      label: 'Revo 2.0 - Premium Quality', 
      cost: 4,
      description: 'Highest quality generations'
    },
  ];

  const platformOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'exciting', label: 'Exciting' },
  ];

  // Handle content generation
  const handleGenerate = useCallback(async () => {
    if (!user || !prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);
    setGenerationResult(null);

    try {
      // Generate content using the credit-aware service
      const result = await creditAwareContentService.generateContent({
        userId: user.userId,
        modelId: selectedModel as RevoModelId,
        prompt: prompt.trim(),
        platform,
        tone,
        contentType: 'social_media',
        feature: 'social_media_content'
      });

      setGenerationResult(result);

      if (result.success && result.data) {
        setGeneratedContent(result.data);
        onContentGenerated?.(result.data);
        
        // Refresh credit balance
        await getCurrentBalance();
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [user, selectedModel, prompt, platform, tone, getCurrentBalance, onContentGenerated]);

  // Check if user can afford the selected model
  const canAfford = creditBalance ? 
    creditBalance.remaining_credits >= getCostForModel(selectedModel) : false;

  const currentUserCredits = creditBalance?.remaining_credits || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>AI Content Generation</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate social media content using our AI models with automatic credit management
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Balance Display */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>Your current credit balance</span>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {currentUserCredits} credits
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as ModelVersion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {model.cost} credits
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform and Tone Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content Prompt</label>
            <Textarea
              placeholder="Describe what content you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generation Button or Credit Gate */}
          <CreditGate
            modelVersion={selectedModel}
            userCredits={currentUserCredits}
            feature="social media content generation"
          >
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              size="lg"
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Content ({getCostForModel(selectedModel)} credits)
                </>
              )}
            </Button>
          </CreditGate>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {generationResult?.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>Content generated successfully!</span>
                  {generationResult.creditInfo && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {generationResult.creditInfo.creditsDeducted} credits used
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Generated Content Display */}
          {generatedContent && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedContent.caption && (
                    <div>
                      <h4 className="font-medium text-green-800">Caption:</h4>
                      <p className="text-green-700">{generatedContent.caption}</p>
                    </div>
                  )}
                  {generatedContent.hashtags && (
                    <div>
                      <h4 className="font-medium text-green-800">Hashtags:</h4>
                      <p className="text-green-700">{generatedContent.hashtags.join(' ')}</p>
                    </div>
                  )}
                  {generationResult?.creditInfo && (
                    <div className="pt-2 border-t border-green-200">
                      <div className="text-sm text-green-600">
                        <span>Credits remaining: {generationResult.creditInfo.remainingCredits}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ContentGenerationExample;