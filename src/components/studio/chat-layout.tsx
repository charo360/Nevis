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
import { useAuth } from '@/hooks/use-auth-supabase';
import { type RevoModel } from '@/components/ui/revo-model-selector';
import { useDesignColors } from '@/contexts/design-color-context';
import { DesignColorPicker } from './design-color-picker';
import ProductImageSelector from './product-image-selector';
import { AssetLibrary } from './asset-library';
import type { CreativeAsset } from '@/lib/services/creative-assets-service';


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
    const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>('revo-2.0');
    const [isPromptBuilderOpen, setIsPromptBuilderOpen] = React.useState(false);
    const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
    const [includeContacts, setIncludeContacts] = React.useState(false); // Contacts toggle - default OFF
    const [isAssetLibraryOpen, setIsAssetLibraryOpen] = React.useState(false);
    const { toast } = useToast();
    const { designColors, updateDesignColors } = useDesignColors();
    const { getAccessToken } = useAuth();
    const chatInputRef = React.useRef<HTMLDivElement>(null);
    const messagesContainerRef = React.useRef<HTMLDivElement>(null);



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

    const handleProductSelect = (productId: string | null) => {
        setSelectedProductId(productId);
        if (productId && brandProfile?.productImages) {
            const product = brandProfile.productImages.find(p => p.id === productId);
            if (product) {
                setImagePreview(product.preview);
                setImageDataUrl(product.preview);
            }
        } else {
            setImagePreview(null);
            setImageDataUrl(null);
        }
    };

    const handleSelectAsset = async (asset: CreativeAsset) => {
        console.log('📦 [Creative Studio] Asset selected:', asset.filename);

        try {
            // Close dialog
            setIsAssetLibraryOpen(false);

            // Set Preview
            setImagePreview(asset.file_url);

            // Add Message
            const assetMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: `Selected asset: ${asset.filename}`,
                imageUrl: asset.file_url,
            };
            setMessages(prev => [...prev, assetMessage]);

            // Show Toast
            toast({
                title: 'Asset Added',
                description: 'Ready to design',
                duration: 3000
            });

            // Handle Data URI conversion
            if (!asset.file_url.startsWith('data:')) {
                setImageDataUrl(asset.file_url);

                fetch(asset.file_url)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                                setImageDataUrl(reader.result);
                            }
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(e => console.warn('Conversion failed', e));
            } else {
                setImageDataUrl(asset.file_url);
            }

        } catch (e) {
            console.warn('Error in handleSelectAsset:', e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to select asset' });
        }

        // Scroll to bottom and focus input
        setTimeout(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
            const textarea = chatInputRef.current?.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    };

    const handleClearProductSelection = () => {
        setSelectedProductId(null);
        setImagePreview(null);
        setImageDataUrl(null);
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

        if (!input.trim() && !imageDataUrl) {
            toast({
                variant: 'destructive',
                title: 'Input Required',
                description: 'Please describe the image or video you want to create, or provide an image asset.',
            });
            return
        };

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input || "Generating from image...",
            // For simplicity, we just show the preview, which could be an image data URL for a video.
            imageUrl: imagePreview,
        };
        setMessages([...messages, newUserMessage]);

        const currentInput = input;

        // Enhanced image handling - always pass uploaded images to AI
        // The enhanced intent detection system in generate-creative-asset.ts will determine how to use it
        // Possible intents: enhance, reference, template, or general context
        let currentImageDataUrl = imageDataUrl;

        // Convert URL to data URI if needed (fallback in case async conversion didn't complete)
        if (currentImageDataUrl && !currentImageDataUrl.startsWith('data:')) {
            try {
                console.log('🔄 [Creative Studio] Converting image URL to data URI in handleSubmit...');
                const response = await fetch(currentImageDataUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    currentImageDataUrl = await new Promise<string>((resolve, reject) => {
                        reader.onloadend = () => {
                            if (reader.result) {
                                resolve(reader.result as string);
                            } else {
                                reject(new Error('Failed to convert image to data URI'));
                            }
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    console.log('✅ [Creative Studio] Successfully converted image URL to data URI in handleSubmit');
                }
            } catch (error) {
                console.error('❌ [Creative Studio] Failed to convert image URL in handleSubmit:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error Processing Image',
                    description: 'Failed to prepare image for generation. Please try selecting the asset again.'
                });
                return;
            }
        }

        // 🔍 DEBUG: Log image upload state
        console.log('🖼️ [Creative Studio] Image Upload Debug:', {
            hasImageDataUrl: !!currentImageDataUrl,
            imageDataUrlLength: currentImageDataUrl?.length || 0,
            imageDataUrlPreview: currentImageDataUrl?.substring(0, 50) || 'none',
            isDataUri: currentImageDataUrl?.startsWith('data:') || false,
            currentInput: currentInput,
            selectedRevoModel: selectedRevoModel,
            outputType: outputType,
            hasBrandProfile: !!brandProfile,
            useBrandProfile: useBrandProfile
        });

        // Build enhanced prompt with image context if image is uploaded
        let enhancedPrompt = currentInput || "Please use this image as reference for a professional design.";
        if (imageDataUrl) {
            if (currentInput) {
                // Detect user's intent for the uploaded image
                const hasEnhanceIntent = /\b(enhance|improve|fix|better|upgrade|refine)\b/i.test(currentInput);
                const hasReferenceIntent = /\b(like|similar|style|inspired|based on|reference)\b/i.test(currentInput);
                const hasTemplateIntent = /\b(template|layout|structure|format|same|exact)\b/i.test(currentInput);

                // Add context to prompt to help AI understand image intent
                if (hasEnhanceIntent) {
                    enhancedPrompt = `[IMAGE UPLOADED - INTENT: ENHANCE] ${currentInput}\n\nIMPORTANT: The user uploaded an image and wants to ENHANCE it. Keep the core elements of the uploaded image while improving quality, composition, and visual appeal based on the user's instructions.`;
                } else if (hasTemplateIntent) {
                    enhancedPrompt = `[IMAGE UPLOADED - INTENT: TEMPLATE] ${currentInput}\n\nIMPORTANT: The user uploaded an image as a TEMPLATE. Match the exact layout, structure, and composition of the uploaded image while applying the user's specific instructions.`;
                } else if (hasReferenceIntent) {
                    enhancedPrompt = `[IMAGE UPLOADED - INTENT: REFERENCE] ${currentInput}\n\nIMPORTANT: The user uploaded an image as a REFERENCE. Use the uploaded image as inspiration for style, composition, and visual direction while creating a new design based on the user's instructions.`;
                } else {
                    // Default: treat as reference/context
                    enhancedPrompt = `[IMAGE UPLOADED - INTENT: CONTEXT] ${currentInput}\n\nIMPORTANT: The user uploaded an image for context. Analyze the image and integrate it naturally into the design based on the user's instructions. Use it as visual context to inform the design direction.`;
                }
            } else {
                // Default prompt when ONLY image is provided
                enhancedPrompt = `[IMAGE UPLOADED] The user has provided an image to use as a basis for creative asset generation. Analyze the style, composition, and subject matter of this image and generate a complementary, professional creative asset that enhances or relates to this visual context.`;
            }

            // 🔍 DEBUG: Log enhanced prompt construction
            console.log('📝 [Creative Studio] Enhanced Prompt Built:', {
                hasInput: !!currentInput,
                enhancedPromptPreview: enhancedPrompt.substring(0, 100)
            });
        }

        setInput('');
        setImagePreview(null);
        setImageDataUrl(null);
        setIsLoading(true);

        try {
            let result;
            let aiResponse: Message;

            // Optimized: Use the remote URL if available to avoid Server Action payload limits (500 Error)
            // If imagePreview is a remote URL (not data:), use it. Otherwise use the data URL.
            const assetUrlToPass = (imagePreview && !imagePreview.startsWith('data:'))
                ? imagePreview
                : currentImageDataUrl;

            if (selectedRevoModel === 'revo-2.0' && outputType === 'image' && brandProfile) {
                // Use Creative Studio's advanced creative asset generation for Revo 2.0
                // This provides unique Creative Studio features like inpainting, outpainting,
                // character consistency, and intelligent editing capabilities
                // Get access token as fallback if cookies don't work
                const accessToken = await getAccessToken().catch(() => null);



                result = await generateCreativeAssetAction(
                    enhancedPrompt, // Use enhanced prompt with image context
                    outputType,
                    assetUrlToPass,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'revo-2.0-gemini-2.5-flash-image-preview', // Use Revo 2.0 model specifically (4 credits)
                    designColors, // Pass design-specific colors
                    accessToken || undefined, // Pass access token as fallback
                    includeContacts // Pass contacts toggle
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
                // Get access token as fallback if cookies don't work
                const accessToken = await getAccessToken().catch(() => null);

                result = await generateCreativeAssetAction(
                    enhancedPrompt, // Use enhanced prompt with image context
                    outputType,
                    assetUrlToPass,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'revo-1.5-gemini-2.5-flash-image-preview', // Use Revo 1.5 model specifically (3 credits)
                    designColors, // Pass design-specific colors
                    accessToken || undefined, // Pass access token as fallback
                    includeContacts // Pass contacts toggle
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
                // Get access token as fallback if cookies don't work
                const accessToken = await getAccessToken().catch(() => null);

                // 🔍 DEBUG: Log Revo 1.0 generation parameters
                console.log('🎯 [Creative Studio] Revo 1.0 Generation Starting:', {
                    enhancedPromptPreview: enhancedPrompt.substring(0, 100),
                    hasCurrentImageDataUrl: !!currentImageDataUrl,
                    currentImageDataUrlLength: currentImageDataUrl?.length || 0,
                    useBrandProfile: useBrandProfile,
                    brandProfileId: brandProfile?.id,
                    outputType: outputType,
                    preferredModel: 'revo-1.0-gemini-2.5-flash-image-preview'
                });

                result = await generateCreativeAssetAction(
                    enhancedPrompt, // Use enhanced prompt with image context
                    outputType,
                    assetUrlToPass,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl - Creative Studio can handle inpainting
                    outputType === 'video' ? aspectRatio : undefined,
                    'revo-1.0-gemini-2.5-flash-image-preview', // Use Revo 1.0 model specifically (3 credits)
                    undefined, // designColors
                    accessToken || undefined, // Pass access token as fallback
                    includeContacts // Pass contacts toggle
                );

                // 🔍 DEBUG: Log generation result
                console.log('✅ [Creative Studio] Revo 1.0 Generation Complete:', {
                    hasImageUrl: !!result.imageUrl,
                    hasVideoUrl: !!result.videoUrl,
                    aiExplanation: result.aiExplanation
                });

                aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `⭐ Your Revo 1.0 stable design is ready! This reliable, high-quality image was generated using proven AI with Creative Studio capabilities including brand integration, professional design standards, and consistent results.`,
                    imageUrl: result.imageUrl,
                    videoUrl: result.videoUrl,
                };
            } else {
                // 🔍 DEBUG: Log fallback generation
                console.log('⚠️ [Creative Studio] Using Fallback Generation:', {
                    selectedRevoModel: selectedRevoModel,
                    outputType: outputType,
                    hasBrandProfile: !!brandProfile,
                    reason: !brandProfile ? 'No brand profile' : 'Other condition not met'
                });
                // Use standard creative asset generation for fallback
                // Get access token as fallback if cookies don't work
                const accessToken = await getAccessToken().catch(() => null);

                result = await generateCreativeAssetAction(
                    enhancedPrompt, // Use enhanced prompt with image context
                    outputType,
                    assetUrlToPass,
                    useBrandProfile,
                    brandProfile,
                    null, // maskDataUrl
                    outputType === 'video' ? aspectRatio : undefined,
                    undefined, // preferredModel
                    undefined, // designColors
                    accessToken || undefined, // Pass access token as fallback
                    includeContacts // Pass contacts toggle
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
            const { getUserFriendlyErrorMessage, extractCreditInfo, isCreditError } = await import('@/lib/error-messages');
            const { ToastAction } = await import('@/components/ui/toast');
            const errorMessage = (error as Error).message;

            // Extract credit information if available
            const creditInfo = extractCreditInfo(errorMessage);

            // Get user-friendly error message
            const friendlyMessage = getUserFriendlyErrorMessage(errorMessage, {
                feature: 'creative_studio',
                modelVersion: selectedRevoModel,
                creditsRequired: creditInfo?.creditsRequired,
                creditsAvailable: creditInfo?.creditsAvailable,
            });

            // Split multi-line messages for chat display
            const chatMessage = friendlyMessage.includes('\n\n')
                ? friendlyMessage.split('\n\n').join('\n')
                : friendlyMessage;

            // Extract title and description for toast
            const parts = friendlyMessage.split('\n\n');
            const title = parts[0] || 'Generation Issue';
            const description = parts.slice(1).join('\n\n') || friendlyMessage;

            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: chatMessage,
            };
            setMessages(prevMessages => [...prevMessages, errorResponse]);

            // Use appropriate toast variant based on error type
            const isCredit = isCreditError(errorMessage);
            toast({
                variant: 'destructive',
                title: title.replace(/\n/g, ' '), // Remove line breaks from title
                description: description,
                duration: isCredit ? Infinity : 5000, // Credit errors stay until dismissed
                action: isCredit ? (
                    <ToastAction
                        altText="Buy Credits"
                        onClick={() => window.location.href = '/pricing#credit-packages'}
                    >
                        Buy Credits
                    </ToastAction>
                ) : undefined,
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
                            {brandProfile?.productImages && brandProfile.productImages.length > 0 && (
                                <ProductImageSelector
                                    productImages={brandProfile.productImages}
                                    selectedProductId={selectedProductId}
                                    onSelectProduct={handleProductSelect}
                                    onClearSelection={handleClearProductSelection}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
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
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        `Create a ${brandProfile?.businessType || 'business'} social media post`,
                                        `Design a sale announcement for ${brandProfile?.businessName || 'my brand'}`,
                                        "Generate a modern product showcase",
                                        "Create an engaging Instagram Story"
                                    ].map((suggestion, i) => (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            className="h-auto py-3 text-left justify-start whitespace-normal"
                                            onClick={() => setInput(suggestion)}
                                        >
                                            <Wand2 className="mr-2 h-4 w-4 text-primary shrink-0" />
                                            <span>{suggestion}</span>
                                        </Button>
                                    ))}
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

            <div ref={chatInputRef} className="flex-shrink-0 border-t bg-background">
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
                    brandName={brandProfile?.businessName}
                    brandType={brandProfile?.businessType}
                    outputType={outputType}
                    setOutputType={setOutputType}
                    handleImageUpload={handleImageUpload}
                    isBrandProfileAvailable={!!brandProfile}
                    onEditImage={onEditImage}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    selectedRevoModel={selectedRevoModel}
                    setSelectedRevoModel={setSelectedRevoModel}
                    includeContacts={includeContacts}
                    setIncludeContacts={setIncludeContacts}
                    onOpenAssetLibrary={() => setIsAssetLibraryOpen(true)}
                />
            </div>

            {/* Asset Library Dialog */}
            <AssetLibrary
                open={isAssetLibraryOpen}
                onOpenChange={setIsAssetLibraryOpen}
                onSelectAsset={handleSelectAsset}
                brandProfileId={brandProfile?.id}
            />
        </div>
    );
}
