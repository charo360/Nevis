# AI Image Editor Integration

This implementation integrates your Google Gemini-powered image editing functionality with masking support into the existing Nevis AI system.

## 🚀 Features

- **AI-Powered Editing**: Uses Google Gemini 2.0 Flash for intelligent image modifications
- **Masking Support**: Paint areas to selectively edit parts of images
- **Natural Language Prompts**: Describe edits in plain English
- **Undo/Redo**: Full history support for mask drawing
- **Error Handling**: Comprehensive error handling and user feedback
- **TypeScript**: Fully typed for better development experience

## 📁 Files Added/Modified

### New Files
- `src/app/api/image-edit/route.ts` - Updated API endpoint supporting both AI and text editing
- `src/hooks/use-ai-image-editor.ts` - Custom hook for AI image editing
- `src/components/studio/magic-studio-modal.tsx` - Main editing modal component
- `src/components/studio/ai-image-editor-example.tsx` - Example usage component
- `src/app/test-ai-editor/page.tsx` - Test page to try the functionality

### Dependencies
- `@google/generative-ai` - Already installed in package.json

## 🔧 Setup

### 1. Environment Variables
Set up your API keys (use dedicated key for image editing to avoid confusion):

```bash
# RECOMMENDED: Dedicated key for image editing
GEMINI_IMAGE_EDIT_API_KEY=your_dedicated_gemini_key_here

# OR use existing keys (fallback)
GOOGLE_AI_API_KEY=your_api_key_here
# OR
GOOGLE_API_KEY=your_api_key_here
# OR
GEMINI_API_KEY=your_api_key_here
# OR
GOOGLE_GENAI_API_KEY=your_api_key_here

# OPTIONAL: For OpenAI DALL-E alternative
OPENAI_API_KEY=your_openai_key_here
```

### 2. Test the Functionality
Navigate to `/test-ai-editor` to try the AI image editing functionality.

## 🎯 Usage

### Basic Usage
```tsx
import { MagicStudioModal } from '@/components/studio/magic-studio-modal';
import { ImageAsset } from '@/hooks/use-ai-image-editor';

function MyComponent() {
  const [showEditor, setShowEditor] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageAsset | null>(null);

  const handleEditConfirm = (original: ImageAsset, editedImage: ImageAsset) => {
    setCurrentImage(editedImage);
    setShowEditor(false);
  };

  return (
    <>
      <button onClick={() => setShowEditor(true)}>Edit Image</button>
      {showEditor && currentImage && (
        <MagicStudioModal
          image={currentImage}
          onConfirm={handleEditConfirm}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
```

### Using the Hook Directly
```tsx
import { useAIImageEditor, ImageAsset } from '@/hooks/use-ai-image-editor';

function MyComponent() {
  const { editImage, isProcessing, error } = useAIImageEditor();

  const handleEdit = async (image: ImageAsset, prompt: string, mask?: ImageAsset) => {
    const result = await editImage(image, prompt, mask);
    if (result) {
      console.log('Edit successful:', result);
    }
  };
}
```

## 🎨 API Endpoints

### POST /api/image-edit

#### AI Editing (New)
```json
{
  "editType": "ai",
  "originalImage": {
    "id": "image_123",
    "url": "data:image/png;base64,...",
    "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "mimeType": "image/png"
  },
  "prompt": "add sunglasses to the person",
  "mask": {
    "id": "mask_123",
    "url": "data:image/png;base64,...",
    "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "mimeType": "image/png"
  }
}
```

#### Text Editing (Legacy)
```json
{
  "editType": "text",
  "originalImageUrl": "https://example.com/image.jpg",
  "command": "change the text to 'Hello World'",
  "brandProfile": {...},
  "platform": "facebook"
}
```

## 🎭 How It Works

1. **Image Upload**: Convert images to base64 format for API compatibility
2. **Masking**: Use HTML5 Canvas to draw selection masks
3. **AI Processing**: Send image + mask + prompt to Google Gemini
4. **Result**: Receive edited image with seamless blending

## 🔍 Key Components

### MagicStudioModal
- Canvas-based masking interface
- Brush/eraser tools with size control
- Undo/redo functionality
- Real-time preview of mask areas

### useAIImageEditor Hook
- Handles API communication
- Error handling and loading states
- Toast notifications for user feedback

### Utility Functions
- `urlToImageAsset()` - Convert URLs to ImageAsset format
- `canvasToImageAsset()` - Convert canvas to ImageAsset format

## 🎯 Example Prompts

- "add sunglasses to the person"
- "change the background to a beach scene"
- "make it nighttime"
- "add a birthday hat"
- "remove the background"
- "change the shirt color to blue"
- "add falling snow"

## 🔧 Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure one of the environment variables is set
   - Restart the development server after adding env vars

2. **Image Too Large**
   - Google Gemini has size limits for images
   - Consider resizing images before editing

3. **Mask Not Working**
   - Ensure you're drawing on the canvas (pink areas)
   - White areas in mask = edit, black areas = keep unchanged

4. **Edit Failed**
   - Check browser console for detailed error messages
   - Verify API key has proper permissions
   - Try simpler prompts first

## 🚀 Integration with Existing System

This implementation:
- ✅ Maintains backward compatibility with existing text-based editing
- ✅ Uses the same API endpoint (`/api/image-edit`)
- ✅ Follows existing code patterns and conventions
- ✅ Integrates with existing UI components and hooks
- ✅ Supports the same authentication system

## 📈 Next Steps

1. **Integration**: Add the MagicStudioModal to your existing image editing workflows
2. **Customization**: Modify the UI to match your design system
3. **Features**: Add more advanced masking tools (shapes, magic wand, etc.)
4. **Optimization**: Implement image compression for faster processing
5. **Analytics**: Track usage and performance metrics

The AI image editing functionality is now ready to use! Navigate to `/test-ai-editor` to try it out.
