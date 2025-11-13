"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Type, Palette, Plus, Minus, Move, RotateCcw } from 'lucide-react';

interface SmartEditSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function SmartEditSuggestions({ onSuggestionClick }: SmartEditSuggestionsProps) {
  const suggestions = [
    {
      category: "Text Editing",
      icon: <Type className="w-4 h-4" />,
      color: "bg-blue-100 text-blue-800",
      items: [
        'Change the headline to "New Product Launch"',
        'Replace the subtitle with "Coming Soon"',
        'Update the body text to describe features',
        'Add a caption at the bottom',
        'Remove the price text',
        'Make the title bigger'
      ]
    },
    {
      category: "Color Changes",
      icon: <Palette className="w-4 h-4" />,
      color: "bg-purple-100 text-purple-800",
      items: [
        'Change background color to blue',
        'Make the text color white',
        'Change button color to green',
        'Update accent color to orange'
      ]
    },
    {
      category: "Element Management",
      icon: <Plus className="w-4 h-4" />,
      color: "bg-green-100 text-green-800",
      items: [
        'Add a "Buy Now" button',
        'Remove the logo',
        'Add contact information',
        'Delete the background image',
        'Move the title to the center',
        'Resize the product image'
      ]
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Smart Edit Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((category) => (
          <div key={category.category} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={category.color}>
                {category.icon}
                {category.category}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {category.items.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8 px-2"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Pro tip:</strong> Use natural language! The AI understands context like "headline", "subtitle", "button", etc.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
