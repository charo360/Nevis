// src/components/studio/chat-layout.tsx
import * as React from 'react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { PromptBuilder } from './prompt-builder';
import type { BrandProfile, Message } from '@/lib/types';
import Balancer from 'react-wrap-balancer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { generateCreativeAssetAction, generateEnhancedDesignAction } from '@/app/actions';
import { generateRevo2CreativeAssetAction } from '@/app/actions/revo-2-actions';
import { useToast } from '@/hooks/use-toast';
import { type RevoModel } from '@/components/ui/revo-model-selector';
import { useDesignColors } from '@/contexts/design-color-context';
import { DesignColorPicker } from './design-color-picker';


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
    const [isPromptBuilderOpen, setIsPromptBuilderOpen] = React.useState(false);
    const { toast } = useToast();
    const { designColors, updateDesignColors } = useDesignColors();



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

    const togglePromptBuilder = React.useCallback(() => {
        setIsPromptBuilderOpen(prev => !prev);
    }, []);

    const handlePromptGenerated = (prompt: string) => {
        // Auto-fill the chat input with the generated prompt
        setInput(prompt);
        // Close the prompt builder to show the chat input
        setIsPromptBuilderOpen(false);

        // Show success message
        toast({
            title: 'Prompt Added to Chat',
            description: 'Your design brief has been added to the chat input. Ready to generate! The form stays populated so you can easily create variations by reopening the builder.',
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Check if video generation is selected
        if (outputType === 'video') {
            const comingSoonMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🎬 Video generation is coming soon! For now, please select "Image" to create stunning visual content. We're working hard to bring you video generation capabilities in a future update.`,
            };
            setMessages(prevMessages => [...prevMessages, comingSoonMessage]);
            return;
        }
        
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
                // Use Creative Studio's advanced creative asset generation for Revo 2.0
                // This provides unique Creative Studio features like inpainting, outpainting,
                // character consistency, and intelligent editing capabilities
                result = await generateCreativeAssetAction(
                    currentInput,
                    outputType,
                    currentImageDataUrl,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'gemini-2.5-flash-image-preview', // Use Revo 2.0 model specifically
                    designColors // Pass design-specific colors
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `🚀 Your Revo 2.0 creative asset is ready! This image was generated using next-generation AI with advanced Creative Studio capabilities including character consistency, intelligent editing, and premium brand integration.`,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                };
            } else if (selectedRevoModel === 'revo-1.5' && outputType === 'image' && brandProfile) {
                // Use Creative Studio's advanced creative asset generation for Revo 1.5
                // This provides unique Creative Studio features like inpainting, outpainting,
                // character consistency, and intelligent editing capabilities
                result = await generateCreativeAssetAction(
                    currentInput,
                    outputType,
                    currentImageDataUrl,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'gemini-2.5-flash-image-preview', // Use Revo 1.5 model specifically
                    designColors // Pass design-specific colors
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `🎨 Your Revo 1.5 enhanced design is ready! This professional-quality image was generated using advanced AI with enhanced Creative Studio capabilities including intelligent editing, brand integration, and premium design principles.`,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                };
            } else if (selectedRevoModel === 'revo-1.0' && outputType === 'image' && brandProfile) {
                // Use Creative Studio's advanced creative asset generation for Revo 1.0
                // This provides unique Creative Studio features like inpainting, outpainting,
                // character consistency, and intelligent editing capabilities
                result = await generateCreativeAssetAction(
                    currentInput,
                    outputType,
                    currentImageDataUrl,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'gemini-2.5-flash-image-preview' // Use Revo 1.0 model specifically
                );

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `⭐ Your Revo 1.0 stable design is ready! This reliable, high-quality image was generated using proven AI with Creative Studio capabilities including brand integration, professional design standards, and consistent results.`,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                };
            } else {
                // Use standard creative asset generation for fallback
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
        <div className="relative flex h-full flex-col max-h-screen">
            {/* Prompt Builder Section */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
                <div className="p-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePromptBuilder();
                        }}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            {isPromptBuilderOpen ? 'Design Brief Builder' : 'Create New Design Brief'}
                        </div>
                        {isPromptBuilderOpen ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>

                    {isPromptBuilderOpen && (
                        <div className="mt-4 max-h-[40vh] overflow-y-auto space-y-4">
                            <PromptBuilder
                                brandProfile={brandProfile}
                                onPromptGenerated={handlePromptGenerated}
                            />
                            <DesignColorPicker />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
                {messages.length === 0 && !isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-4">
                        <Card className="max-w-2xl w-full">
                            <CardContent className="p-6">
                                <Bot className="mx-auto h-12 w-12 text-primary mb-4" />
                                <h1 className="text-2xl font-bold font-headline">Creative Studio</h1>
                                <div className="text-muted-foreground mt-2">
                                    <Balancer>
                                        Welcome to your AI-powered creative partner. Use the Design Brief Builder above to create structured prompts, or describe what you want directly in the chat. The builder form stays populated so you can easily create multiple design variations!
                                    </Balancer>
                                </div>
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

            <div className="flex-shrink-0 border-t bg-background">
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
        </div>
    );
}
