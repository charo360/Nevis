'use client';

import React, { useState } from 'react';
// import { TextBasedImageEditor } from '@/components/studio/text-based-image-editor';
// import { QuickContentWithEditor } from '@/components/studio/quick-content-with-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wand2, TestTube, Image as ImageIcon, Edit3, Pen } from 'lucide-react';
import { BrandProfile } from '@/lib/types';

// Sample brand profile for testing
const sampleBrandProfile: BrandProfile = {
  businessName: "Zentech Electronics",
  businessType: "Electronics Retailer",
  location: "Nairobi, Kenya",
  description: "Leading electronics retailer specializing in laptops, tablets, and mobile devices",
  targetAudience: "Tech-savvy professionals and students",
  services: "Electronics sales, repairs, and technical support",
  primaryColor: "#2563eb",
  accentColor: "#f59e0b",
  visualStyle: "modern",
  writingTone: "professional",
  contentThemes: "Technology, Innovation, Quality"
};

// Sample generated content for testing
const sampleGeneratedContent = {
  imageUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3BlY2lhbCBPZmZlcjwvdGV4dD4KICA8dGV4dCB4PSIyMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGF0ZXN0IExhcHRvcHMgJiBUYWJsZXRzPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZjU5ZTBiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj41MCUgT0ZGPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGFydGluZyBmcm9tIEtFUyA0NSwwMDA8L3RleHQ+CiAgPHJlY3QgeD0iMTUwIiB5PSIyODAiIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmNTllMGIiIHJ4PSI1Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIzMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CdXkgTm93PC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMzUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5aZW50ZWNoIEVsZWN0cm9uaWNzPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMzcwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4rMjU0IDcxMiAzNDUgNjc4PC90ZXh0Pgo8L3N2Zz4=",
  headline: "Special Offer",
  subheadline: "Latest Laptops & Tablets",
  caption: "Transform your productivity with our latest collection of high-performance laptops and tablets. Perfect for professionals and students alike. Starting from KES 45,000 with 50% OFF on selected items. Limited time offer!",
  cta: "Buy Now",
  hashtags: ["#TechDeals", "#Laptops", "#Tablets", "#ZentechElectronics"]
};

export default function TestImageEditorPage() {
  const [testImageUrl, setTestImageUrl] = useState(sampleGeneratedContent.imageUrl);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('standalone');

  const handleCustomImageSubmit = () => {
    if (customImageUrl.trim()) {
      setTestImageUrl(customImageUrl.trim());
    }
  };

  const handleEditComplete = (editedImageUrl: string, explanation: string) => {
    console.log('Edit completed:', { editedImageUrl, explanation });
    setTestImageUrl(editedImageUrl);
  };

  const handleContentUpdate = (updatedContent: any) => {
    console.log('Content updated:', updatedContent);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Text-Based Image Editor Test</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Test the new text-based image editing feature. Use natural language commands to edit images 
          like "Change 'Special Offer' to 'Limited Deal'" or "Make the logo bigger".
        </p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Wand2 className="h-3 w-3 mr-1" />
          Ready for Testing
        </Badge>
      </div>

      {/* Custom Image URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Test with Custom Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="Enter image URL or data URL to test with..."
              className="flex-1"
            />
            <Button onClick={handleCustomImageSubmit}>
              Load Image
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            You can use any image URL or generate content first, then test editing it.
          </p>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-red-500 text-white p-2 rounded-full">
                <Pen className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Look for the Red Pen Icons!</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The red pen icons (🖊️) indicate editable elements. Scroll down to the "Standalone Editor" tab
              to see the text-based editing interface where you can type commands like "Change 'Special Offer' to 'Limited Deal'".
            </p>
            <Button
              onClick={() => setActiveTab('standalone')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Go to Text Editor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="standalone">Standalone Editor</TabsTrigger>
          <TabsTrigger value="integrated">Integrated with Content</TabsTrigger>
        </TabsList>

        {/* Standalone Editor Test */}
        <TabsContent value="standalone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-500" />
                Standalone Text-Based Image Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the editor component independently with a sample image. The red pen icon indicates editable areas.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Preview with Edit Icon */}
              <div className="relative inline-block">
                <img
                  src={testImageUrl}
                  alt="Test Image"
                  className="max-w-md border rounded-lg shadow-sm"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                  <Pen className="h-4 w-4" />
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Click pen to edit with text commands
                </div>
              </div>

              {/* Editor Component - Temporarily Disabled */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Text-Based Editor</h3>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800">
                    🚧 Editor component temporarily disabled for debugging.
                    The red pen icons above show where editing would be available.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Try the basic test page: <a href="/test-basic" className="underline">http://localhost:3001/test-basic</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrated Editor Test */}
        <TabsContent value="integrated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Integrated Quick Content with Editor
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Test the full integrated experience with content preview, editing, and history.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Preview with Edit Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <img
                    src={sampleGeneratedContent.imageUrl}
                    alt="Generated Content"
                    className="w-full border rounded-lg shadow-sm"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg">
                    <Pen className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="relative p-3 border rounded bg-gray-50">
                    <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                      <Pen className="h-3 w-3" />
                    </div>
                    <h3 className="font-semibold">{sampleGeneratedContent.headline}</h3>
                  </div>
                  <div className="relative p-3 border rounded bg-gray-50">
                    <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                      <Pen className="h-3 w-3" />
                    </div>
                    <p className="text-sm">{sampleGeneratedContent.subheadline}</p>
                  </div>
                  <div className="relative p-3 border rounded bg-gray-50">
                    <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                      <Pen className="h-3 w-3" />
                    </div>
                    <p className="text-xs text-muted-foreground">{sampleGeneratedContent.caption}</p>
                  </div>
                </div>
              </div>

              {/* Integrated Editor - Temporarily Disabled */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Integrated Content Editor</h3>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800">
                    🚧 Integrated editor component temporarily disabled for debugging.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    The red pen icons above show where text editing would be available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Test Commands Reference</CardTitle>
          <p className="text-sm text-muted-foreground">
            Try these example commands to test the natural language parsing:
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Text Replacement</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Change 'Special Offer' to 'Limited Deal'"</li>
                <li>• "Replace 'Buy Now' with 'Shop Today'"</li>
                <li>• "Update '50% OFF' to '60% OFF'"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Element Removal</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Remove the phone number"</li>
                <li>• "Delete the background text"</li>
                <li>• "Eliminate the company name"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Color Changes</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Change color of title to red"</li>
                <li>• "Make the button green"</li>
                <li>• "Turn the background white"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Size Adjustments</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• "Make the logo bigger"</li>
                <li>• "Make title smaller"</li>
                <li>• "Increase button size"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Endpoint:</strong> <code>POST /api/image-edit</code></div>
            <div><strong>Branch:</strong> <code>imageedit</code></div>
            <div><strong>Status:</strong> <Badge variant="outline" className="ml-2">Ready for Testing</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
