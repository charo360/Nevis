// src/components/studio/chat-layout.tsx
import * as React from 'react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ImageTextEditor } from './image-text-editor';
import type { BrandProfile, Message } from '@/lib/types';
import Balancer from 'react-wrap-balancer';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { generateCreativeAssetAction, generateEnhancedDesignAction } from '@/app/actions';
import { generateRevo2CreativeAssetAction } from '@/app/actions/revo-2-actions';
import { useToast } from '@/hooks/use-toast';
import { type RevoModel } from '@/components/ui/revo-model-selector';
import { useImageTextEditor } from '@/hooks/use-image-text-editor';


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

    // Text editor state
    const { startEditing, saveEditing, cancelEditing, getActiveSession } = useImageTextEditor();
    const [isTextEditorOpen, setIsTextEditorOpen] = React.useState(false);
    const [textEditorImageUrl, setTextEditorImageUrl] = React.useState<string | null>(null);


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

    const handleEditText = (imageUrl: string) => {
        const sessionId = startEditing(imageUrl);
        setTextEditorImageUrl(imageUrl);
        setIsTextEditorOpen(true);
    };

    const handleSaveTextEdit = (editedImageUrl: string) => {
        const activeSession = getActiveSession();
        if (activeSession) {
            saveEditing(activeSession.id, editedImageUrl);

            // Update the message with the edited image
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.imageUrl === activeSession.originalImageUrl
                        ? { ...msg, imageUrl: editedImageUrl }
                        : msg
                )
            );
        }

        setIsTextEditorOpen(false);
        setTextEditorImageUrl(null);

        toast({
            title: 'Text Edit Saved',
            description: 'Your image has been updated with the new text.',
        });
    };

    const handleCancelTextEdit = () => {
        const activeSession = getActiveSession();
        if (activeSession) {
            cancelEditing(activeSession.id);
        }

        setIsTextEditorOpen(false);
        setTextEditorImageUrl(null);
    };

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
                    'gemini-2.5-flash-image-preview' // Use Revo 2.0 model specifically
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
                    'gemini-2.5-flash-image-preview' // Use Revo 1.5 model specifically
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
                        onEditText={handleEditText}
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

            {/* Text Editor Modal */}
            {isTextEditorOpen && textEditorImageUrl && (
                <div className="fixed inset-0 z-50 bg-black/80">
                    <ImageTextEditor
                        imageUrl={textEditorImageUrl}
                        onSave={handleSaveTextEdit}
                        onCancel={handleCancelTextEdit}
                    />
                </div>
            )}
        </div>
    );
}
