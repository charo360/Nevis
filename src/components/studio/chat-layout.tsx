// src/components/studio/chat-layout.tsx
import * as React from 'react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import type { BrandProfile, Message } from '@/lib/types';
import Balancer from 'react-wrap-balancer';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { generateCreativeAssetAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


interface ChatLayoutProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (value: string) => void;
  brandProfile: BrandProfile | null;
}

export function ChatLayout({ messages, setMessages, input, setInput, brandProfile }: ChatLayoutProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
    const [useBrandProfile, setUseBrandProfile] = React.useState(!!brandProfile);
    const [outputType, setOutputType] = React.useState<'image' | 'video'>('image');
    const { toast } = useToast();


    React.useEffect(() => {
        setUseBrandProfile(!!brandProfile);
    }, [brandProfile]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setImagePreview(dataUrl);
                setImageDataUrl(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() && !imageDataUrl) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            imageUrl: imagePreview,
        };
        setMessages([...messages, newUserMessage]);
        
        const currentInput = input;
        const currentImageDataUrl = imageDataUrl;
        
        setInput('');
        setImagePreview(null);
        setImageDataUrl(null);
        setIsLoading(true);

        try {
            const result = await generateCreativeAssetAction(
                currentInput,
                outputType,
                currentImageDataUrl,
                useBrandProfile,
                brandProfile
            );

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.aiExplanation,
                imageUrl: result.imageUrl,
                videoUrl: result.videoUrl,
            };
            setMessages(prevMessages => [...prevMessages, aiResponse]);

        } catch (error) {
             const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I ran into an error: ${(error as Error).message}`,
            };
            setMessages(prevMessages => [...prevMessages, errorResponse]);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 && !isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-4">
                        <Card className="max-w-2xl w-full">
                            <CardContent className="p-6">
                                <Bot className="mx-auto h-12 w-12 text-primary mb-4" />
                                <h1 className="text-2xl font-bold font-headline">Creative Studio</h1>
                                <p className="text-muted-foreground mt-2">
                                     <Balancer>
                                        Welcome to your AI-powered creative partner. Describe the ad you want, upload a reference image, and let&apos;s create something amazing together.
                                    </Balancer>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <ChatMessages messages={messages} isLoading={isLoading} />
                )}
            </div>
            
            <ChatInput 
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                useBrandProfile={useBrandProfile}
                setUseBrandProfile={setUseBrandProfile}
                outputType={outputType}
                setOutputType={setOutputType}
                handleImageUpload={handleImageUpload}
                isBrandProfileAvailable={!!brandProfile}
            />
        </div>
    );
}
