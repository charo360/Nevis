// src/components/studio/chat-messages.tsx
import * as React from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChatAvatar } from './chat-avatar';
import { Loader2, Download, Wand, Brush } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onSetReferenceAsset: (url: string | null | undefined, type: 'image' | 'video') => void;
  onEditImage: (url: string) => void;
}

export function ChatMessages({ messages, isLoading, onSetReferenceAsset, onEditImage }: ChatMessagesProps) {
  const scrollableContainerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleDownload = async (url: string | null | undefined, type: 'image' | 'video') => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'No asset URL found.',
      });
      return;
    }

    try {
      // Download the original HD file directly to preserve quality
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileExtension = type === 'image' ? 'png' : 'mp4';
      link.download = `nevis-hd-${type}-${Date.now()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'HD Download Complete',
        description: `High-definition ${type} downloaded successfully.`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: `Could not download the ${type}. Please try again.`,
      });
    }
  };


  return (
    <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto p-4">
      <TooltipProvider>
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={cn('flex items-start gap-4', message.role === 'user' && 'justify-end')}>
              {message.role === 'assistant' && <ChatAvatar role="assistant" />}
              <div
                className={cn(
                  'max-w-[80%] space-y-2 rounded-lg p-3',
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                {/* User uploaded image preview */}
                {message.role === 'user' && message.imageUrl && (
                  <div className="relative w-48 h-48 overflow-hidden rounded-md border">
                    <Image src={message.imageUrl} alt="User upload preview" layout="fill" objectFit="cover" />
                  </div>
                )}

                <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                {/* AI generated image */}
                {message.role === 'assistant' && message.imageUrl && (
                  <div className="group relative w-full max-w-sm overflow-hidden rounded-md border">
                    <Image src={message.imageUrl} alt="Generated image" width={512} height={512} className="w-full h-auto object-contain" crossOrigin='anonymous' />
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEditImage(message.imageUrl!)}
                          >
                            <Brush className="h-4 w-4" />
                            <span className="sr-only">Edit Image</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit with Inpainting</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onSetReferenceAsset(message.imageUrl, 'image')}
                          >
                            <Wand className="h-4 w-4" />
                            <span className="sr-only">Refine Image</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refine this image (new prompt)</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(message.imageUrl, 'image')}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download Image</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download image</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}

                {/* AI generated video */}
                {message.role === 'assistant' && message.videoUrl && (
                  <div className="group relative w-full max-w-sm overflow-hidden rounded-md border">
                    <video controls autoPlay src={message.videoUrl} className="w-full" />
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onSetReferenceAsset(message.videoUrl, 'video')}
                          >
                            <Wand className="h-4 w-4" />
                            <span className="sr-only">Refine Video</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refine this video (new prompt)</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(message.videoUrl, 'video')}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download Video</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download video</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}

              </div>
              {message.role === 'user' && <ChatAvatar role="user" />}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4">
              <ChatAvatar role="assistant" />
              <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
