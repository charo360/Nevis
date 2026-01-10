// src/components/studio/chat-input.tsx
import * as React from 'react';
import { Paperclip, Send, Image as ImageIcon, Video, Wand, X, Brush, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RevoModelSelector, type RevoModel } from '@/components/ui/revo-model-selector';
import { getUserCredits } from '@/app/actions/pricing-actions';
import Image from "next/image";
import { cn } from '@/lib/utils';
import type { BrandProfile } from '@/lib/types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  imagePreview: string | null;
  setImagePreview: (value: string | null) => void;
  setImageDataUrl: (value: string | null) => void;
  useBrandProfile: boolean;
  setUseBrandProfile: (value: boolean) => void;
  outputType: 'image' | 'video';
  setOutputType: (value: 'image' | 'video') => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isBrandProfileAvailable: boolean;
  onEditImage: (url: string) => void;
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16';
  setAspectRatio: (value: '1:1' | '4:5' | '16:9' | '9:16') => void;
  selectedRevoModel: RevoModel;
  setSelectedRevoModel: (value: RevoModel) => void;
  userCredits?: number;
  includeContacts: boolean;
  setIncludeContacts: (value: boolean) => void;
  onOpenAssetLibrary: () => void;
  brandProfile?: BrandProfile | null;
}

export function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  imagePreview,
  setImagePreview,
  setImageDataUrl,
  useBrandProfile,
  setUseBrandProfile,
  outputType,
  setOutputType,
  handleImageUpload,
  includeContacts,
  setIncludeContacts,
  isBrandProfileAvailable,
  onEditImage,
  aspectRatio,
  setAspectRatio,
  selectedRevoModel,
  setSelectedRevoModel,
  userCredits,
  onOpenAssetLibrary,
  brandProfile,
}: ChatInputProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const generateRandomPrompt = () => {
    if (!brandProfile) {
      const genericTemplates = [
        "Create a high-converting social media post",
        "Design a minimalist product showcase",
        "Generate a seasonal sale announcement",
        "Create an engaging Instagram Story"
      ];
      const randomPrompt = genericTemplates[Math.floor(Math.random() * genericTemplates.length)];
      setInput(randomPrompt);
      return;
    }

    const {
      businessName,
      businessType,
      targetAudience,
      contentThemes,
      keyFeatures,
      visualStyle,
      writingTone
    } = brandProfile;

    const name = businessName || 'our brand';
    const type = businessType || 'business';
    const audience = targetAudience || 'our customers';
    const themes = contentThemes?.split(',').map(t => t.trim()).filter(t => t) || [];
    const features = keyFeatures?.split('\n').map(f => f.replace(/^[-*]\s*/, '').trim()).filter(f => f) || [];
    const style = visualStyle || 'professional';

    const templates = [
      // Focus on Target Audience
      `Create a ${style} post tailored for ${audience} that perfectly represents ${name}.`,

      // Focus on Content Themes
      themes.length > 0
        ? `Design an engaging creative focusing on ${themes[Math.floor(Math.random() * themes.length)]} for ${name}.`
        : `Generate a high-impact promotional design for ${name}.`,

      // Focus on Key Features
      features.length > 0
        ? `Create a product highlight for ${name} focusing on our ${features[Math.floor(Math.random() * features.length)]} feature.`
        : `Design a professional product showcase for ${name}.`,

      // Focus on Tone/Style
      `Generate a ${style} social media visual using a ${writingTone || 'professional'} tone for ${name}.`,

      // Business Type specific
      `Design a stunning header for a ${type} that speaks to ${audience}.`,

      // Mixed Context
      `Create a social post for ${name} that combines ${themes[0] || 'our core values'} with a focus on ${audience}.`,

      // Call to action focused
      `Design a "Limited Time Offer" visual for ${name} in a ${style} style for ${audience}.`
    ];

    const randomPrompt = templates[Math.floor(Math.random() * templates.length)];
    setInput(randomPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative w-full border-t">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Enhanced Image Preview - More Prominent */}
        {imagePreview && (
          <div className="mb-3 p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="relative w-32 h-32 flex-shrink-0 group">
                <Image
                  src={imagePreview}
                  alt="Selected asset preview"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md border-2 border-primary/30"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => onEditImage(imagePreview)}
                        >
                          <span className="sr-only">Edit image</span>
                          <Brush className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit this image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Asset Selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This asset will be used as reference for your design
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={handleRemoveImage}
                  >
                    <span className="sr-only">Remove asset</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={imagePreview
              ? "✨ Describe how to use this asset (e.g., 'create an ad with this product', 'use as background', 'enhance this image')..."
              : "Describe the design you want to create, or select an asset from your library..."}
            className="pr-20 resize-none min-h-[4rem] max-h-40"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={generateRandomPrompt}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 mr-1"
                  >
                    <Wand className="h-4 w-4" />
                    <span className="sr-only">AI Suggestion</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI Suggestion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={imagePreview ? "default" : "ghost"}
                    onClick={onOpenAssetLibrary}
                    disabled={isLoading}
                    className={cn(imagePreview && "bg-primary/10 hover:bg-primary/20 text-primary")}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span className="sr-only">Asset Library</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-xs">
                    <p className="font-semibold mb-1">Asset Library</p>
                    <p>Access your uploaded images and reuse them in designs</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Paperclip />
                    <span className="sr-only">Attach image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs max-w-xs">
                    <p className="font-semibold mb-1">Upload Image</p>
                    <p>Upload an image to:</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Enhance and improve it</li>
                      <li>Use as style reference</li>
                      <li>Use as layout template</li>
                      <li>Integrate into new design</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Button type="submit" size="icon" variant="ghost" disabled={isLoading || (!input && !imagePreview)}>
              <Send />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="brand-profile-switch"
                checked={useBrandProfile}
                onCheckedChange={setUseBrandProfile}
                disabled={!isBrandProfileAvailable}
              />
              <Label htmlFor="brand-profile-switch">Apply Brand Profile</Label>
              {!isBrandProfileAvailable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground">(No profile found)</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Go to Brand Profile to set one up.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="contacts-switch"
                checked={includeContacts}
                onCheckedChange={setIncludeContacts}
                disabled={!useBrandProfile || !isBrandProfileAvailable}
              />
              <Label htmlFor="contacts-switch">Include Contact Info</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add phone, email, and website to the design footer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center space-x-2">
              <Label>AI Model:</Label>
              <RevoModelSelector
                selectedModel={selectedRevoModel}
                onModelChange={setSelectedRevoModel}
                disabled={!isBrandProfileAvailable || outputType !== 'image'}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Label>Output Type:</Label>
              <RadioGroup value={outputType} onValueChange={(v) => setOutputType(v as 'image' | 'video')} className="flex items-center space-x-4" disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="r-image" />
                  <Label htmlFor="r-image" className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="r-video" disabled />
                  <Label htmlFor="r-video" className="flex items-center gap-2 text-muted-foreground"><Video className="h-4 w-4" /> Video (Coming Soon)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-4">
              <Label>Size:</Label>
              <RadioGroup value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '1:1' | '4:5' | '16:9' | '9:16')} className="flex items-center space-x-2 sm:space-x-4 flex-wrap" disabled={isLoading}>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="1:1" id="r-1-1" />
                  <Label htmlFor="r-1-1" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                    <span className="w-4 h-4 border border-current rounded-sm" />
                    1:1
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="4:5" id="r-4-5" />
                  <Label htmlFor="r-4-5" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                    <span className="w-3 h-4 border border-current rounded-sm" />
                    4:5
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="16:9" id="r-16-9" />
                  <Label htmlFor="r-16-9" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                    <span className="w-5 h-3 border border-current rounded-sm" />
                    16:9
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="9:16" id="r-9-16" />
                  <Label htmlFor="r-9-16" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                    <span className="w-3 h-5 border border-current rounded-sm" />
                    9:16
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full sm:w-auto sm:min-w-[120px]" disabled={isLoading || (!input && !imagePreview) || outputType === 'video'}>
              {isLoading ? 'Generating...' : outputType === 'video' ? 'Coming Soon' : <><Wand className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
