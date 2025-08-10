// src/components/studio/chat-messages.tsx
import * as React from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChatAvatar } from './chat-avatar';
import { Loader2, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollableContainerRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleDownload = (url: string | null | undefined, type: 'image' | 'video') => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'No asset URL found.',
      });
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    const fileExtension = type === 'image' ? 'png' : 'mp4';
    link.download = `creative-asset-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div ref={scrollableContainerRef} className="flex-1 overflow-y-auto p-4">
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
                {message.imageUrl && (
                     <div className="relative w-full max-w-xs overflow-hidden rounded-md border">
                        <Image src={message.imageUrl} alt="Generated image" layout="fill" objectFit="cover" />
                     </div>
                )}
                 {message.videoUrl && (
                     <div className="relative w-full max-w-xs overflow-hidden rounded-md border">
                        <video controls autoPlay src={message.videoUrl} className="w-full" />
                     </div>
                )}
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {(message.imageUrl || message.videoUrl) && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(message.imageUrl || message.videoUrl, message.videoUrl ? 'video' : 'image')}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
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
    </div>
  );
}
