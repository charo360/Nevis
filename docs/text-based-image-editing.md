# Text-Based Image Editing Feature

## Overview

The Text-Based Image Editing feature allows users to edit generated designs using natural language commands. Instead of using complex image editing tools, users can simply describe what they want to change in plain English.

## Features

### Supported Edit Types

1. **Text Replacement**
   - Change specific words or phrases
   - Replace entire text blocks
   - Update headlines, CTAs, and body text

2. **Element Removal**
   - Remove unwanted text elements
   - Delete background elements
   - Eliminate watermarks or logos

3. **Color Changes**
   - Change colors of specific elements
   - Update brand colors
   - Modify text and background colors

4. **Size Adjustments**
   - Make elements bigger or smaller
   - Resize logos, text, and graphics
   - Adjust proportions

5. **Text Addition**
   - Add new text elements
   - Insert additional information
   - Include new CTAs or messages

6. **Element Movement**
   - Reposition elements
   - Move text to different locations
   - Adjust layout positioning

## Usage Examples

### Text Replacement
```
"Change 'Special Offer' to 'Limited Deal'"
"Replace 'Buy Now' with 'Shop Today'"
"Update the headline to 'New Product Launch'"
```

### Element Removal
```
"Remove the background text"
"Delete the phone number"
"Eliminate the watermark"
```

### Color Changes
```
"Change color of title to blue"
"Make the button red"
"Turn the background green"
```

### Size Adjustments
```
"Make the logo bigger"
"Make title smaller"
"Increase button size"
```

### Text Addition
```
"Add 'New Product' text"
"Insert 'Coming Soon'"
"Include 'Limited Time Only'"
```

### Element Movement
```
"Move the logo to the left"
"Center the button"
"Relocate text to the top"
```

## API Reference

### POST /api/image-edit

Edit an image using natural language commands.

#### Request Body
```typescript
{
  originalImageUrl: string;      // URL or data URL of the image to edit
  command: string;               // Natural language edit command
  brandProfile?: BrandProfile;   // Optional brand guidelines
  platform?: string;            // Target platform (instagram, facebook, etc.)
  preserveStyle?: boolean;       // Whether to maintain original design style (default: true)
}
```

#### Response
```typescript
{
  success: boolean;
  editedImageUrl?: string;       // URL of the edited image
  appliedEdits: EditCommand[];   // List of edits that were applied
  processingTime: number;        // Time taken to process the edit (ms)
  explanation?: string;          // Human-readable explanation of changes
  suggestions?: string[];        // Suggestions for improving the command
  warnings?: string[];           // Warnings about potentially destructive edits
  error?: string;               // Error message if edit failed
}
```

## React Components

### TextBasedImageEditor

Main component for text-based image editing interface.

```tsx
import { TextBasedImageEditor } from '@/components/studio/text-based-image-editor';

<TextBasedImageEditor
  originalImageUrl={imageUrl}
  brandProfile={brandProfile}
  platform="instagram"
  onEditComplete={(editedUrl, explanation) => {
    console.log('Edit complete:', editedUrl);
  }}
/>
```

### QuickContentWithEditor

Integrated component that combines content preview with editing capabilities.

```tsx
import { QuickContentWithEditor } from '@/components/studio/quick-content-with-editor';

<QuickContentWithEditor
  generatedContent={{
    imageUrl: "...",
    headline: "...",
    subheadline: "...",
    caption: "..."
  }}
  brandProfile={brandProfile}
  platform="instagram"
  onContentUpdate={(updatedContent) => {
    console.log('Content updated:', updatedContent);
  }}
/>
```

## React Hook

### useTextImageEditor

Custom hook for managing text-based image editing state and operations.

```tsx
import { useTextImageEditor } from '@/hooks/use-text-image-editor';

const {
  isProcessing,
  editHistory,
  currentImageUrl,
  applyEdit,
  resetToOriginal,
  undoLastEdit,
  validateCommand,
  getEditSuggestions,
  canUndo,
  hasEdits
} = useTextImageEditor({
  brandProfile,
  platform: 'instagram',
  onEditComplete: (result) => {
    console.log('Edit completed:', result);
  },
  onError: (error) => {
    console.error('Edit failed:', error);
  }
});

// Apply an edit
const result = await applyEdit(imageUrl, "Change 'Hello' to 'Hi'");
```

## Advanced Features

### Command Parsing

The system uses advanced natural language processing to understand user commands:

- **Synonym Recognition**: Understands variations like "change", "replace", "substitute"
- **Context Awareness**: Recognizes targets and replacements in various formats
- **Confidence Scoring**: Provides confidence levels for parsed commands
- **Validation**: Checks for potentially harmful or unclear commands

### Error Handling

- **Command Validation**: Prevents destructive or unclear commands
- **Graceful Degradation**: Provides helpful suggestions for failed commands
- **Retry Logic**: Automatic retry for transient failures
- **User Feedback**: Clear error messages and improvement suggestions

### Performance Optimization

- **Efficient Processing**: Optimized AI prompts for faster generation
- **Caching**: Intelligent caching of edit results
- **Batch Operations**: Support for multiple edits in sequence
- **Progress Tracking**: Real-time progress updates for long operations

## Integration Guide

### Adding to Existing Components

1. **Install Dependencies**: Ensure all required dependencies are installed
2. **Import Components**: Import the text-based editing components
3. **Add to UI**: Integrate the editing interface into your existing UI
4. **Handle Events**: Set up event handlers for edit completion and errors

### Example Integration

```tsx
import { useState } from 'react';
import { TextBasedImageEditor } from '@/components/studio/text-based-image-editor';

function MyContentGenerator() {
  const [generatedImage, setGeneratedImage] = useState('');
  const [editedImage, setEditedImage] = useState('');

  return (
    <div className="space-y-6">
      {/* Your existing content generation UI */}
      
      {generatedImage && (
        <TextBasedImageEditor
          originalImageUrl={editedImage || generatedImage}
          onEditComplete={(newImageUrl) => {
            setEditedImage(newImageUrl);
          }}
        />
      )}
    </div>
  );
}
```

## Best Practices

### Command Writing

1. **Be Specific**: Use specific element names and clear descriptions
2. **Use Quotes**: Wrap text in quotes for clarity: `"Change 'Old Text' to 'New Text'"`
3. **One Edit at a Time**: Make one change per command for better accuracy
4. **Test Commands**: Use the validation function to check commands before applying

### Error Handling

1. **Validate First**: Always validate commands before sending to API
2. **Provide Feedback**: Show clear error messages and suggestions to users
3. **Enable Undo**: Always provide undo functionality for user confidence
4. **Save History**: Keep edit history for user reference and debugging

### Performance

1. **Optimize Images**: Use appropriate image sizes for faster processing
2. **Batch Edits**: Consider batching multiple small edits when possible
3. **Cache Results**: Cache edit results to avoid reprocessing
4. **Monitor Usage**: Track edit success rates and processing times

## Troubleshooting

### Common Issues

1. **Command Not Understood**
   - Solution: Use more specific language and check examples
   - Check the suggestions provided by the parser

2. **Edit Takes Too Long**
   - Solution: Ensure image size is reasonable (< 2MB recommended)
   - Check network connectivity

3. **Poor Edit Quality**
   - Solution: Provide more specific commands
   - Ensure brand profile is properly configured

4. **API Errors**
   - Solution: Check API endpoint availability
   - Verify request format and required parameters

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In your component
console.log('Command parsing result:', parsingResult);
console.log('Edit request:', editRequest);
console.log('API response:', response);
```

## Future Enhancements

- **Batch Editing**: Support for multiple commands in one request
- **Undo/Redo Stack**: Advanced history management
- **Real-time Preview**: Live preview of edits before applying
- **Voice Commands**: Voice-to-text command input
- **Template Edits**: Predefined edit templates for common changes
- **Collaborative Editing**: Multi-user editing support
