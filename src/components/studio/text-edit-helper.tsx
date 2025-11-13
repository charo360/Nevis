/**
 * Text Edit Helper Component
 * Provides an easy interface for text replacement in designs
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Type, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TextEditHelperProps {
  onPromptGenerated: (prompt: string) => void;
}

export function TextEditHelper({ onPromptGenerated }: TextEditHelperProps) {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const generatePrompt = () => {
    if (!oldText.trim() || !newText.trim()) return;
    
    const prompt = `Change "${oldText}" to "${newText}"`;
    onPromptGenerated(prompt);
    
    // Clear fields after generating
    setOldText('');
    setNewText('');
  };

  const examplePrompts = [
    { old: 'Summer Sale', new: 'Winter Sale', desc: 'Change seasonal promotion' },
    { old: '50% OFF', new: '75% OFF', desc: 'Update discount percentage' },
    { old: 'Contact Us', new: 'Get Started', desc: 'Change CTA text' },
    { old: 'Premium', new: 'Professional', desc: 'Update tier name' },
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Text Replacement</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="old-text">Find text:</Label>
            <Input
              id="old-text"
              placeholder="Original text to replace"
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generatePrompt()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-text">Replace with:</Label>
            <Input
              id="new-text"
              placeholder="New text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generatePrompt()}
            />
          </div>
        </div>

        <Button 
          onClick={generatePrompt}
          disabled={!oldText.trim() || !newText.trim()}
          className="w-full"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Generate Edit Command
        </Button>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Tips for better results:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Use exact text as it appears in the image</li>
              <li>• For best results, select the text area with the brush tool</li>
              <li>• Keep replacement text similar in length to original</li>
              <li>• The AI will match the original font and style</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? 'Hide' : 'Show'} Examples
        </Button>

        {showExamples && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm text-gray-600 font-medium">Common text edits:</p>
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setOldText(example.old);
                  setNewText(example.new);
                }}
                className="w-full text-left p-2 rounded hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    "{example.old}" → "{example.new}"
                  </span>
                  <span className="text-xs text-gray-500">{example.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
