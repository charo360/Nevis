// src/components/studio/chat-layout.tsx
import * as React from 'react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import type { BrandProfile, Message } from '@/lib/types';
import Balancer from 'react-wrap-balancer';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { generateCreativeAssetAction, generateEnhancedDesignAction } from '@/app/actions';
import { generateRevo2CreativeAssetAction } from '@/app/actions/revo-2-actions';
import { useToast } from '@/hooks/use-toast';
import { type RevoModel } from '@/components/ui/revo-model-selector';


interface ChatLayoutProps {
    brandProfile: BrandProfile | null;
    onEditImage: (imageUrl: string) => void;
}

export function ChatLayout({ brandProfile, onEditImage }: ChatLayoutProps) {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [input, setInput] = React.useState('');
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
    const [useBrandProfile, setUseBrandProfile] = React.useState(!!brandProfile);
    const [outputType, setOutputType] = React.useState<'image' | 'video'>('image');
    const [aspectRatio, setAspectRatio] = React.useState<'16:9' | '9:16'>('16:9');
    const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>('revo-1.5');
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

    const handleSetReferenceAsset = (url: string | null | undefined, type: 'image' | 'video') => {
        if (url) {
            setOutputType(type);
            setImagePreview(url); // Using imagePreview for both image and video previews in the input area.
            setImageDataUrl(url);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) {
            toast({
                variant: 'destructive',
                title: 'Input Required',
                description: 'Please describe the image or video you want to create.',
            });
            return
        };

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            // For simplicity, we just show the preview, which could be an image data URL for a video.
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
            let result;
            let aiResponse: Message;

            if (selectedRevoModel === 'revo-2.0' && outputType === 'image' && brandProfile) {
                // Use Revo 2.0 next-generation AI for images with brand profile
                const revo2Result = await generateRevo2CreativeAssetAction(
                    currentInput,
                    brandProfile,
                    {
                        platform: 'instagram', // Default platform for Creative Studio
                        aspectRatio: '1:1', // Default to square for Creative Studio
                        style: 'photographic',
                        quality: 'ultra',
                        mood: 'professional'
                    }
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `🌟 ${selectedRevoModel} Revolutionary AI Generated!\n\nQuality Score: ${revo2Result.qualityScore}/10\nEnhancements: ${revo2Result.enhancementsApplied.join(', ')}\nProcessing Time: ${revo2Result.processingTime}ms\n\nThis image was created using our next-generation AI engine with revolutionary capabilities and ultra-high quality results.`,
                    imageUrl: revo2Result.imageUrl,
                };
            } else if (selectedRevoModel === 'revo-1.5' && outputType === 'image' && brandProfile) {
                // Use enhanced design generation for images with brand profile
                const enhancedResult = await generateEnhancedDesignAction(
                    brandProfile.businessType || 'business',
                    'instagram', // Default platform, could be made configurable
                    brandProfile.visualStyle || 'modern',
                    currentInput, // Creative Studio uses simple text input for now
                    brandProfile,
                    true,
                    { strictConsistency: true, followBrandColors: true } // Enable all enhancements for Creative Studio
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `✨ ${selectedRevoModel} Enhanced Design Generated!\n\nQuality Score: ${enhancedResult.qualityScore}/10\nEnhancements: ${enhancedResult.enhancementsApplied.join(', ')}\nProcessing Time: ${enhancedResult.processingTime}ms\n\nThis design uses professional design principles, platform optimization, and quality validation for superior results.`,
                    imageUrl: enhancedResult.imageUrl,
                };
            } else {
                // Use standard creative asset generation
                console.log(`🚀 Using ${selectedRevoModel} for standard generation`);
                result = await generateCreativeAssetAction(
                    currentInput,
                    outputType,
                    currentImageDataUrl,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl
                    outputType === 'video' ? aspectRatio : undefined,
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: result.aiExplanation,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                };
            }

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
                                        Welcome to your AI-powered creative partner. Describe the ad you want, upload an image to edit, or start from scratch.
                                    </Balancer>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <ChatMessages
                        messages={messages}
                        isLoading={isLoading}
                        onSetReferenceAsset={handleSetReferenceAsset}
                        onEditImage={onEditImage}
                    />
                )}
            </div>

            <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setImageDataUrl={setImageDataUrl}
                useBrandProfile={useBrandProfile}
                setUseBrandProfile={setUseBrandProfile}
                outputType={outputType}
                setOutputType={setOutputType}
                handleImageUpload={handleImageUpload}
                isBrandProfileAvailable={!!brandProfile}
                onEditImage={onEditImage}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                selectedRevoModel={selectedRevoModel}
                setSelectedRevoModel={setSelectedRevoModel}
            />
        </div>
    );
}
