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
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (value: '16:9' | '9:16') => void;
  selectedRevoModel: RevoModel;
  setSelectedRevoModel: (value: RevoModel) => void;
  userCredits?: number;
  includeContacts: boolean;
  setIncludeContacts: (value: boolean) => void;
  onOpenAssetLibrary: () => void;
  brandName?: string;
  brandType?: string;
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
  brandName,
  brandType,
}: ChatInputProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const generateRandomPrompt = () => {
    const type = brandType || 'business';
    const name = brandName || 'my brand';

    // Different templates for variety
    const templates = [
      `Create a high-converting social media post for ${name}`,
      `Design a minimalist product showcase for a ${type}`,
      `Generate a seasonal sale announcement for ${name}`,
      `Create an engaging Instagram Story for a ${type}`,
      `Design a professional LinkedIn header for ${name}`,
      `Create a "Coming Soon" teaser for a new ${type} product`,
      `Generate a customer testimonial layout for ${name}`,
      `Design a clean, modern promotional banner for ${name}`,
      `Create a "Meet the Team" social post for a ${type}`,
      `Generate a behind-the-scenes content layout for ${name}`,
      `Design a quote card that aligns with ${name}'s style`,
      `Create an educational infographic for a ${type} audience`
    ];

    // Pick a random template
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
                showCredits={true}
                userCredits={userCredits}
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

            <div className={cn("flex items-center space-x-4", outputType === 'video' ? 'opacity-100' : 'opacity-0')}>
              <Label>Aspect Ratio:</Label>
              <RadioGroup value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '16:9' | '9:16')} className="flex items-center space-x-4" disabled={isLoading || outputType !== 'video'}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="16:9" id="r-16-9" />
                  <Label htmlFor="r-16-9" className="flex items-center gap-2">16:9 (Sound)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9:16" id="r-9-16" />
                  <Label htmlFor="r-9-16" className="flex items-center gap-2">9:16 (No Sound)</Label>
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
