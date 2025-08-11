// src/components/studio/chat-input.tsx
import * as React from 'react';
import { Paperclip, Send, Image as ImageIcon, Video, Wand, X, Brush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from "next/image";

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
  isBrandProfileAvailable,
  onEditImage,
}: ChatInputProps) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative mt-auto w-full border-t">
       <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="relative">
          {imagePreview && (
            <div className="group absolute bottom-full mb-2 w-24 h-24">
                <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md"/>
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                                    onClick={() => onEditImage(imagePreview)}
                                >
                                    <span className="sr-only">Edit image</span>
                                    <Brush className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit this image</TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                 </div>
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background"
                    onClick={handleRemoveImage}
                >
                    <span className="sr-only">Remove image</span>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
          )}
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image or video you want to create..."
            className="pr-20 resize-none min-h-[4rem] max-h-40"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Paperclip />
                    <span className="sr-only">Attach image</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach a reference image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
             />
            <Button type="submit" size="icon" variant="ghost" disabled={isLoading || !input}>
              <Send />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            <div className="flex items-center space-x-4">
                <Label>Output Type:</Label>
                 <RadioGroup defaultValue={outputType} onValueChange={(v) => setOutputType(v as 'image' | 'video')} className="flex items-center space-x-4" disabled={isLoading}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="r-image" />
                        <Label htmlFor="r-image" className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="r-video" />
                        <Label htmlFor="r-video" className="flex items-center gap-2"><Video className="h-4 w-4" /> Video</Label>
                    </div>
                </RadioGroup>
            </div>
             
             <Separator orientation="vertical" className="h-6 hidden sm:block" />

             <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !input}>
                {isLoading ? 'Generating...' : <><Wand className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
        </div>
      </form>
    </div>
  );
}
