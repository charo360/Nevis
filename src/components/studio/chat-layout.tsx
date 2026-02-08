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
import { analyzeImageWithVision, formatVisionAnalysisForDisplay, type VisionAnalysisResult } from '@/lib/services/google-vision';

// 🔧 FEATURE FLAG: Temporarily disable Vision API (set to true to re-enable)
const ENABLE_VISION_API = false;

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
    const [visionAnalysis, setVisionAnalysis] = React.useState<VisionAnalysisResult | null>(null); // NEW: Store Vision API results
    const [useBrandProfile, setUseBrandProfile] = React.useState(!!brandProfile);
    const [outputType, setOutputType] = React.useState<'image' | 'video'>('image');
    const [aspectRatio, setAspectRatio] = React.useState<'1:1' | '4:5' | '16:9' | '9:16'>('1:1');
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

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (max 20MB)
        const maxSizeMB = 20;
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: `Image size (${fileSizeMB.toFixed(1)}MB) exceeds maximum of ${maxSizeMB}MB. Please use a smaller image or compress it first.`,
            });
            return;
        }

        try {
            // Show loading toast
            const loadingToast = toast({
                title: 'Processing Image...',
                description: 'Optimizing for upload...',
            });

            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;

                // Compress image if needed (using utility from image-compression.ts)
                const { compressImageDataUrl, estimateBase64SizeMB } = await import('@/utils/image-compression');
                const originalSizeMB = estimateBase64SizeMB(dataUrl.split(',')[1]);

                let finalDataUrl = dataUrl;
                if (originalSizeMB > 10) {
                    console.log(`🔄 [Creative Studio] Compressing image from ${originalSizeMB.toFixed(2)}MB...`);
                    finalDataUrl = await compressImageDataUrl(dataUrl, {
                        maxWidth: 2048,
                        maxHeight: 2048,
                        quality: 0.85,
                        maxSizeMB: 10
                    });
                    const compressedSizeMB = estimateBase64SizeMB(finalDataUrl.split(',')[1]);
                    const reductionPercent = ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(1);
                    console.log(`✅ [Creative Studio] Compressed to ${compressedSizeMB.toFixed(2)}MB (${reductionPercent}% reduction)`);

                    // Show success toast with compression stats
                    toast({
                        title: 'Image Optimized',
                        description: `Compressed from ${originalSizeMB.toFixed(1)}MB to ${compressedSizeMB.toFixed(1)}MB (${reductionPercent}% smaller)`,
                        duration: 3000,
                    });
                } else {
                    console.log(`✅ [Creative Studio] Image size (${originalSizeMB.toFixed(2)}MB) is optimal, no compression needed`);
                }

                // NEW: Analyze image with Google Vision API with progressive feedback
                // 🔧 FEATURE FLAG: Skip Vision API if disabled
                let analysisToastId: any = null;
                if (ENABLE_VISION_API) {
                    try {
                        // Show initial analyzing toast
                        analysisToastId = toast({
                            title: '🔍 Analyzing Image...',
                            description: 'Gathering visual information from your image',
                            duration: 30000, // Keep visible during analysis
                        });

                        console.log('🔍 [Creative Studio] Analyzing image with Vision API...');

                        // Update toast to show we're working
                        setTimeout(() => {
                            if (analysisToastId) {
                                toast({
                                    title: '🎨 Detecting Colors & Objects...',
                                    description: 'Extracting dominant colors and identifying elements',
                                    duration: 30000,
                                });
                            }
                        }, 500);

                        const visionResult = await analyzeImageWithVision(finalDataUrl);

                        if (visionResult.error) {
                            console.warn('⚠️ [Vision API] Analysis failed:', visionResult.error);
                            // Continue without Vision data - don't block upload
                            toast({
                                title: 'Image Uploaded',
                                description: 'Image analysis unavailable, but upload successful',
                                duration: 2000,
                            });
                        } else {
                            console.log('✅ [Vision API] Analysis complete:', {
                                labels: visionResult.labels.length,
                                colors: visionResult.dominantColors.length,
                                text: visionResult.fullTextAnnotation ? 'detected' : 'none',
                                logos: visionResult.logos.length,
                            });

                            // Store Vision analysis
                            setVisionAnalysis(visionResult);

                            // Show success with what we found
                            const findingsCount = [
                                visionResult.labels.length > 0 ? 'objects' : null,
                                visionResult.dominantColors.length > 0 ? 'colors' : null,
                                visionResult.logos.length > 0 ? 'brands' : null,
                                visionResult.fullTextAnnotation ? 'text' : null,
                            ].filter(Boolean);

                            toast({
                                title: '✅ Analysis Complete!',
                                description: `Found ${findingsCount.join(', ')} - ${formatVisionAnalysisForDisplay(visionResult)}`,
                                duration: 5000,
                            });
                        }
                    } catch (visionError) {
                        console.error('❌ [Vision API] Analysis error:', visionError);
                        // Continue without Vision - don't block the upload
                        setVisionAnalysis(null);
                        toast({
                            title: 'Image Uploaded',
                            description: 'Analysis failed, but image uploaded successfully',
                            duration: 2000,
                        });
                    }
                } else {
                    console.log('ℹ️ [Creative Studio] Vision API disabled via feature flag');
                    // Just show simple upload success
                    toast({
                        title: '✅ Image Uploaded',
                        description: 'Image ready for generation',
                        duration: 2000,
                    });
                }

                setImagePreview(finalDataUrl);
                setImageDataUrl(finalDataUrl);
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('❌ [Creative Studio] Image processing error:', error);
            toast({
                variant: 'destructive',
                title: 'Image Processing Failed',
                description: 'Failed to process image. Please try a different file.',
            });
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
                title: 'Asset Loading...',
                description: 'Optimizing asset for generation',
                duration: 2000
            });

            // Handle Data URI conversion with compression
            if (!asset.file_url.startsWith('data:')) {
                // Fetch and convert to data URI
                const response = await fetch(asset.file_url);
                if (!response.ok) {
                    throw new Error('Failed to fetch asset');
                }

                const blob = await response.blob();
                const reader = new FileReader();

                reader.onloadend = async () => {
                    if (typeof reader.result === 'string') {
                        try {
                            // Compress if needed
                            const { compressImageDataUrl, estimateBase64SizeMB } = await import('@/utils/image-compression');
                            const originalDataUrl = reader.result;
                            const originalSizeMB = estimateBase64SizeMB(originalDataUrl.split(',')[1]);

                            let finalDataUrl = originalDataUrl;
                            if (originalSizeMB > 10) {
                                console.log(`🔄 [Creative Studio] Compressing selected asset from ${originalSizeMB.toFixed(2)}MB...`);
                                finalDataUrl = await compressImageDataUrl(originalDataUrl, {
                                    maxWidth: 2048,
                                    maxHeight: 2048,
                                    quality: 0.85,
                                    maxSizeMB: 10
                                });
                                const compressedSizeMB = estimateBase64SizeMB(finalDataUrl.split(',')[1]);
                                console.log(`✅ [Creative Studio] Asset compressed to ${compressedSizeMB.toFixed(2)}MB`);
                            }

                            setImageDataUrl(finalDataUrl);

                            toast({
                                title: 'Asset Ready',
                                description: 'Asset optimized and ready to use',
                                duration: 2000
                            });
                        } catch (compressionError) {
                            console.warn('⚠️ [Creative Studio] Asset compression failed:', compressionError);
                            // Fallback to uncompressed if compression fails
                            setImageDataUrl(reader.result);
                            toast({
                                title: 'Asset Ready',
                                description: 'Asset loaded (optimization skipped)',
                                duration: 2000
                            });
                        }
                    }
                };
                reader.readAsDataURL(blob);
            } else {
                // Already a data URI - compress if needed
                try {
                    const { compressImageDataUrl, estimateBase64SizeMB } = await import('@/utils/image-compression');
                    const originalSizeMB = estimateBase64SizeMB(asset.file_url.split(',')[1]);

                    let finalDataUrl = asset.file_url;
                    if (originalSizeMB > 10) {
                        console.log(`🔄 [Creative Studio] Compressing selected data URI from ${originalSizeMB.toFixed(2)}MB...`);
                        finalDataUrl = await compressImageDataUrl(asset.file_url, {
                            maxWidth: 2048,
                            maxHeight: 2048,
                            quality: 0.85,
                            maxSizeMB: 10
                        });
                        const compressedSizeMB = estimateBase64SizeMB(finalDataUrl.split(',')[1]);
                        console.log(`✅ [Creative Studio] Data URI compressed to ${compressedSizeMB.toFixed(2)}MB`);
                    }

                    setImageDataUrl(finalDataUrl);
                } catch (error) {
                    console.warn('⚠️ [Creative Studio] Data URI compression failed:', error);
                    setImageDataUrl(asset.file_url);
                }
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
                    //Default: treat as reference/context but ensure deep analysis
                    enhancedPrompt = `[VISUAL IMAGE + INSTRUCTIONS PROVIDED]

USER'S REQUEST: "${currentInput}"

🎯 CRITICAL TWO-STEP PROCESS:

STEP 1 - ANALYZE THE UPLOADED IMAGE:
Before doing anything, extract these details from the uploaded image:
• Visual elements: What objects, products, or subjects do you see?
• Color palette: What are the dominant colors?
• Text content: Is there any text visible in the image?
• Mood & style: What's the emotional tone and visual style?
• Context: What is this image showing and why?

STEP 2 - BLEND IMAGE + INSTRUCTIONS:
Create a design that:
✅ Incorporates specific visual details you identified from the image
✅ Fulfills the user's written instructions
✅ Feels like a natural combination of BOTH the image and the request
✅ References colors, objects, or elements from the uploaded image
✅ Matches or complements the image's mood and style

The final result should show you understood BOTH the uploaded image AND the user's instructions. Make it feel cohesive and intentional, not disconnected.`;
                }
            } else {
                // Default prompt when ONLY image is provided - CRITICAL: Must analyze image deeply
                enhancedPrompt = `[VISUAL IMAGE PROVIDED - ANALYSIS REQUIRED]

🎯 CRITICAL INSTRUCTION: The user uploaded a visual image without detailed text instructions.

YOU MUST:
1. **ANALYZE THE IMAGE THOROUGHLY** - Identify all visual elements:
   • Objects, products, or subjects visible
   • Dominant colors and color palette
   • Any text or typography in the image
   • Mood, tone, and emotional feeling
   • Visual style (modern, vintage, minimalist, bold, etc.)
   • Composition and layout characteristics

2. **UNDERSTAND THE CONTEXT**:
   • What is this image showing? (product, lifestyle, brand photo, etc.)
   • What's the likely marketing purpose?
   • What audience would this appeal to?
   • What message does it convey?

3. **CREATE NATURAL, IMAGE-AWARE CONTENT**:
   • Generate design elements that complement the image's colors and style
   • Write copy that relates to what you see in the image
   • Match the mood and tone of the uploaded visual
   • Reference specific elements you identified (e.g., if you see a blue product, mention it)
   • Make it feel like the design was custom-made for THIS specific image

🎯 **SMART IMAGE MODIFICATIONS (ALLOWED IF NATURAL):**
   • You MAY modify the image if it enhances the design
   • Modifications MUST look 100% photorealistic and natural
   • Adding objects to hands? Ensure proper grip and realistic positioning
   • Maintain original photo quality and lighting throughout
   • If you can't make it look natural, add design elements around the image instead

✅ GOOD: Adding tablet to hand with proper grip, natural shadows, realistic positioning
❌ BAD: Floating objects, awkward hand positions, mismatched lighting

❌ DO NOT: Create generic content unrelated to the image
❌ DO NOT: Make modifications that look fake or reduce quality
✅ DO: Show you understood the image by referencing its specific visual details
✅ DO: Ensure any modifications are indistinguishable from the original photo quality

Your output should feel completely natural and contextually connected to the uploaded image.`;
            }

            // 🔍 DEBUG: Log enhanced prompt construction
            console.log('📝 [Creative Studio] Enhanced Prompt Built:', {
                hasInput: !!currentInput,
                hasVisionAnalysis: !!visionAnalysis,
                enhancedPromptPreview: enhancedPrompt.substring(0, 100)
            });
        }

        // Add Vision API analysis to prompt if available
        if (visionAnalysis && !visionAnalysis.error) {
            const { formatVisionAnalysisForAI } = await import('@/lib/services/google-vision');
            const visionPrompt = formatVisionAnalysisForAI(visionAnalysis);
            enhancedPrompt = visionPrompt + '\n\n' + enhancedPrompt;
            console.log('🎨 [Creative Studio] Added Vision API analysis to prompt');
        }

        setInput('');
        setImagePreview(null);
        setImageDataUrl(null);
        setVisionAnalysis(null); // Clear Vision analysis when submitting
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
                    aspectRatio, // Pass selected aspect ratio for image size
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
                    aspectRatio, // Pass selected aspect ratio for image size
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
                    aspectRatio, // Pass selected aspect ratio for image size
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
                    aspectRatio, // Pass selected aspect ratio for image/video size
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

            // Check for 413 Payload Too Large error
            if (errorMessage.includes('413') || errorMessage.toLowerCase().includes('payload too large')) {
                const errorResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '⚠️ Image Upload Issue\n\nThe image you uploaded is too large for our servers to process. This usually happens when an image wasn\'t compressed properly.\n\nPlease try:\n• Uploading a smaller image\n• Using a different image\n• Refreshing the page and trying again',
                };
                setMessages(prevMessages => [...prevMessages, errorResponse]);

                toast({
                    variant: 'destructive',
                    title: '413 - Payload Too Large',
                    description: 'Image exceeds upload limit. Please try a smaller file.',
                    duration: 5000,
                });

                setIsLoading(false);
                return;
            }

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
                    brandProfile={brandProfile}
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
