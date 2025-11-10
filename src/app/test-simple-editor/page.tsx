'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Pen, Wand2 } from 'lucide-react';

export default function TestSimpleEditorPage() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  // Sample image URL (simple SVG)
  const sampleImageUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NTAlIE9GRjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGltaXRlZCBUaW1lPC90ZXh0Pgo8L3N2Zz4=";

  const handleEdit = async () => {
    if (!command.trim()) {
      setResult('Please enter a command');
      return;
    }

    setIsProcessing(true);
    setResult('Processing...');

    try {
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: sampleImageUrl,
          command: command.trim(),
          brandProfile: {
            businessName: "Test Business",
            businessType: "retail",
            location: "Test Location"
          },
          platform: "instagram",
          preserveStyle: true
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult(`✅ Edit successful! ${data.explanation || 'Image edited successfully'}`);
      } else {
        setResult(`❌ Error: ${data.error || 'Failed to edit image'}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🔧 Simple Text-Based Image Editor Test</h1>
        <p className="text-muted-foreground">
          Simplified test page to verify the text-based image editing functionality.
        </p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Wand2 className="h-3 w-3 mr-1" />
          Testing Mode
        </Badge>
      </div>

      {/* Image with Red Pen Icon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-500" />
            Test Image with Edit Indicator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative inline-block">
            <img 
              src={sampleImageUrl} 
              alt="Test Image" 
              className="max-w-md border rounded-lg shadow-sm"
              style={{ maxWidth: '400px', height: 'auto' }}
            />
            {/* RED PEN ICON - This should be visible! */}
            <div 
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
              style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                backgroundColor: '#ef4444', 
                color: 'white', 
                padding: '8px', 
                borderRadius: '50%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }}
            >
              <Pen className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
            </div>
            <div 
              className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs"
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              🖊️ Editable with text commands
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Interface */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            Text-Based Editor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Type a command to edit the image above. For example: "Change 'Special Offer' to 'Limited Deal'"
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Type your edit command here..."
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleEdit}
              disabled={isProcessing || !command.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Apply Edit
                </>
              )}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <div className="p-3 rounded-lg bg-gray-100 border">
              <p className="text-sm">{result}</p>
            </div>
          )}

          {/* Example Commands */}
          <div className="space-y-2">
            <h4 className="font-medium">Example Commands:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommand("Change 'Special Offer' to 'Limited Deal'")}
                className="justify-start text-left"
              >
                Change 'Special Offer' to 'Limited Deal'
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommand("Make the title bigger")}
                className="justify-start text-left"
              >
                Make the title bigger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommand("Change color of text to red")}
                className="justify-start text-left"
              >
                Change color of text to red
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommand("Remove '50% OFF' text")}
                className="justify-start text-left"
              >
                Remove '50% OFF' text
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>API Endpoint:</strong> <code>/api/image-edit</code></div>
            <div><strong>Current Command:</strong> <code>{command || 'None'}</code></div>
            <div><strong>Processing:</strong> <code>{isProcessing ? 'Yes' : 'No'}</code></div>
            <div><strong>Page Status:</strong> <span className="text-green-600">✅ Loaded Successfully</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
