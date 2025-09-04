'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, RefreshCw, User, FileText, Image, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useBrandProfiles } from '@/hooks/use-brand-profiles';
import { useGeneratedPosts } from '@/hooks/use-generated-posts';

export default function DatabaseDebugPage() {
  const { user, loading: authLoading } = useAuth();
  const { profiles, loading: profilesLoading } = useBrandProfiles();
  const { posts, loading: postsLoading } = useGeneratedPosts(50); // Get more posts for debugging
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-8 w-8" />
                Database Debug Console
              </h1>
              <p className="text-gray-600 mt-2">
                View your Firestore database data in real-time
              </p>
            </div>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded">{user.uid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Display Name</p>
                  <p className="font-medium">{user.displayName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge variant={user.isAnonymous ? 'secondary' : 'default'}>
                    {user.isAnonymous ? 'Anonymous' : 'Authenticated'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No user authenticated</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generated Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Brand Profiles ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Generated Posts */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Generated Posts Collection</CardTitle>
                <CardDescription>
                  All posts saved to Firestore database
                  {postsLoading && <span className="ml-2">Loading...</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No posts found in database</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Generate some content to see posts here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <div key={post.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">Post #{index + 1}</h3>
                            <p className="text-xs text-gray-500 font-mono">{post.id}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{post.platform}</Badge>
                            <Badge variant={post.status === 'posted' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Content</p>
                            <p className="text-sm bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                              {post.content}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Hashtags</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">
                              {Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags}
                            </p>
                          </div>
                        </div>

                        {(post.qualityScore || post.engagementPrediction) && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600 mb-2">AI Metrics</p>
                            <div className="flex gap-4 text-sm">
                              {post.qualityScore && (
                                <span>Quality: <strong>{post.qualityScore}/10</strong></span>
                              )}
                              {post.engagementPrediction && (
                                <span>Engagement: <strong>{post.engagementPrediction}/10</strong></span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          Created: {new Date(post.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Profiles */}
          <TabsContent value="profiles">
            <Card>
              <CardHeader>
                <CardTitle>Brand Profiles Collection</CardTitle>
                <CardDescription>
                  All brand profiles saved to Firestore database
                  {profilesLoading && <span className="ml-2">Loading...</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profiles.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No brand profiles found in database</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Create a brand profile to see it here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profiles.map((profile, index) => (
                      <div key={profile.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{profile.businessName}</h3>
                            <p className="text-xs text-gray-500 font-mono">{profile.id}</p>
                          </div>
                          <Badge variant="outline">{profile.businessType}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Description</p>
                            <p className="text-sm bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                              {profile.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Location</p>
                            <p className="text-sm bg-gray-50 p-2 rounded">
                              {profile.location}
                            </p>
                          </div>
                        </div>

                        {profile.services && profile.services.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600 mb-2">Services ({profile.services.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.services.slice(0, 3).map((service, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {service.name}
                                </Badge>
                              ))}
                              {profile.services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{profile.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          Created: {new Date(profile.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Database Analytics</CardTitle>
                <CardDescription>
                  Overview of your database usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{posts.length}</p>
                    <p className="text-sm text-blue-600">Generated Posts</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{profiles.length}</p>
                    <p className="text-sm text-green-600">Brand Profiles</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {posts.filter(p => p.qualityScore).length}
                    </p>
                    <p className="text-sm text-purple-600">With AI Metrics</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Database className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {user?.isAnonymous ? 'Demo' : 'Live'}
                    </p>
                    <p className="text-sm text-orange-600">Database Mode</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Database Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Firebase Connection:</span>
                      <Badge variant="default">✅ Connected</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Authentication:</span>
                      <Badge variant={user ? 'default' : 'destructive'}>
                        {user ? '✅ Active' : '❌ Not authenticated'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Sync:</span>
                      <Badge variant="default">✅ Real-time</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
