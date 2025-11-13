/**
 * Test page for AI Image Editor
 * Navigate to /test-ai-editor to try the functionality
 */

import { AIImageEditorExample } from '@/components/studio/ai-image-editor-example';

export default function TestAIEditorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AIImageEditorExample />
    </div>
  );
}
