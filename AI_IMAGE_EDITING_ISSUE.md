# AI Image Editing Issue & Solution

## 🚨 Current Problem

You're experiencing the issue where the AI **generates completely new images instead of editing existing ones**. This is because:

### Google Gemini Limitation
- Google Gemini's `generateContent` API is designed for **image generation**, not **image editing**
- Even with detailed prompts about "editing" and "preserving original elements", it creates new images
- This is a fundamental limitation of the current Gemini model

## ✅ Solutions

### Option 1: Use OpenAI DALL-E (Recommended)
OpenAI's DALL-E has true image editing capabilities:

1. **Add OpenAI API Key** to your environment:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **Use the OpenAI endpoint** we created:
   ```typescript
   // In your component, use the OpenAI endpoint directly
   const response = await fetch('/api/image-edit-openai', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       originalImage: yourImageAsset,
       prompt: "your edit description",
       mask: yourMaskAsset // optional
     })
   });
   ```

### Option 2: Fix the Hook (Quick Fix)

Update the `useAIImageEditor` hook to properly support OpenAI:

**In `src/hooks/use-ai-image-editor.ts`, replace the `editImage` function signature:**

```typescript
const editImage = async (
  originalImage: ImageAsset,
  prompt: string,
  mask?: ImageAsset | null,
  useOpenAI: boolean = false
): Promise<ImageAsset | null> => {
```

**And update the API call:**
```typescript
const apiEndpoint = useOpenAI ? '/api/image-edit-openai' : '/api/image-edit';
const requestBody = useOpenAI 
  ? { originalImage, prompt, mask }  // OpenAI format
  : { editType: 'ai', originalImage, prompt, mask }; // Gemini format
```

### Option 3: Client-Side Image Editing

For true image editing without AI limitations, consider:

1. **Fabric.js** - Canvas-based image editing
2. **Konva.js** - 2D canvas library
3. **Photopea API** - Photoshop-like editing
4. **Canvas API** - Native browser image manipulation

## 🎯 Immediate Action

**To test true image editing right now:**

1. Set your OpenAI API key:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```

2. Test the OpenAI endpoint directly at `/test-ai-editor`

3. In the modal, select "OpenAI DALL-E (true editing)" option

## 📋 Expected Results

- **Google Gemini**: Will generate new images (current behavior)
- **OpenAI DALL-E**: Will actually edit the existing image
- **Client-side**: Immediate editing without API calls

## 🔧 Why This Happens

1. **Gemini**: Designed for content generation, not image editing
2. **DALL-E**: Has dedicated image editing endpoints (`/images/edits`)
3. **Stable Diffusion**: Has inpainting capabilities for true editing

The solution is to use the right tool for the job - OpenAI DALL-E for AI-powered image editing, or implement client-side editing for immediate results.
