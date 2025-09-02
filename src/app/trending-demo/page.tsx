'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, Hash, Calendar, Briefcase } from 'lucide-react';

interface TrendingData {
  keywords: string[];
  topics: string[];
  themes: string[];
  articles: any[];
  lastUpdated: string;
}

interface TrendingEnhancement {
  keywords: string[];
  topics: string[];
  hashtags: string[];
  seasonalThemes: string[];
  industryBuzz: string[];
}

export default function TrendingDemo() {
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [enhancement, setEnhancement] = useState<TrendingEnhancement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trending?format=full');
      const result = await response.json();
      
      if (result.success) {
        setTrendingData(result.data);
      } else {
        setError(result.error || 'Failed to fetch trending data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnhancement = async (context: any = {}) => {
    try {
      // This would call your trending enhancer service
      // For demo purposes, we'll simulate the data
      const mockEnhancement: TrendingEnhancement = {
        keywords: ['ai', 'social media', 'marketing', 'content', 'digital', 'trends', 'viral', 'engagement'],
        topics: ['AI in Marketing', 'Social Media Trends 2025', 'Content Creation Tips'],
        hashtags: ['#ai', '#socialmedia', '#marketing', '#content', '#digital', '#trends'],
        seasonalThemes: ['new year', 'resolution', 'fresh start'],
        industryBuzz: ['artificial intelligence', 'machine learning', 'automation'],
      };
      setEnhancement(mockEnhancement);
    } catch (err) {
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchTrendingData();
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchTrendingData();
    fetchEnhancement();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            Trending Content Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time trending data from social media and marketing RSS feeds
          </p>
        </div>
        
        <Button 
          onClick={refreshData} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="enhancement">Enhancement</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {trendingData?.keywords.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Topics Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {trendingData?.topics.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Articles Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {trendingData?.articles.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {trendingData && (
            <Card>
              <CardHeader>
                <CardTitle>Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {new Date(trendingData.lastUpdated).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Top Trending Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading keywords...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingData?.keywords.slice(0, 50).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhancement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Suggested Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enhancement?.hashtags.map((hashtag, index) => (
                    <Badge key={index} variant="outline" className="text-blue-600">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seasonal Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enhancement?.seasonalThemes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-green-600">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Industry Buzz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enhancement?.industryBuzz.map((buzz, index) => (
                    <Badge key={index} variant="outline" className="text-purple-600">
                      {buzz}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhanced Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enhancement?.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Articles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading articles...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingData?.articles.slice(0, 10).map((article, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-sm mb-1">{article.title}</h3>
                      <p className="text-gray-600 text-xs mb-2">{article.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Source: {article.source}</span>
                        <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
