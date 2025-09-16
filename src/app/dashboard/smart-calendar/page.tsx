// src/app/dashboard/smart-calendar/page.tsx
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Bot,
  Target,
  Sparkles,
  Users,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useToast } from '@/hooks/use-toast';

interface ContentSlot {
  id: string;
  date: string;
  time: string;
  platform: string;
  contentType: 'post' | 'story' | 'reel' | 'carousel';
  contentIdea: string;
  hashtags: string[];
  estimatedReach: number;
  confidenceScore: number;
  isOptimalTime: boolean;
  trendingTopics: string[];
  status: 'scheduled' | 'draft' | 'published' | 'generating';
}

interface CalendarSettings {
  autoGenerate: boolean;
  frequency: number; // posts per week
  platforms: string[];
  optimalTimesOnly: boolean;
  includeTrending: boolean;
  contentMix: {
    educational: number;
    promotional: number;
    engagement: number;
    trendy: number;
  };
}

export default function SmartCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentBrand } = useUnifiedBrand();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [contentSlots, setContentSlots] = React.useState<ContentSlot[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = React.useState(false);

  const [settings, setSettings] = React.useState<CalendarSettings>({
    autoGenerate: false,
    frequency: 5, // 5 posts per week
    platforms: ['Instagram', 'LinkedIn'],
    optimalTimesOnly: true,
    includeTrending: true,
    contentMix: {
      educational: 40,
      promotional: 30,
      engagement: 20,
      trendy: 10
    }
  });

  // Redirect if no auth or brand
  React.useEffect(() => {
    if (!user || !currentBrand) {
      router.push('/dashboard');
    }
  }, [user, currentBrand, router]);

  // Load existing calendar
  React.useEffect(() => {
    if (!currentBrand) return;
    loadSmartCalendar();
  }, [currentBrand]);

  const loadSmartCalendar = async () => {
    setIsLoading(true);
    try {
      // Simulate loading calendar data (integrate with your AI content planning system)
      const mockSlots: ContentSlot[] = generateMockCalendarSlots();
      setContentSlots(mockSlots);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockCalendarSlots = (): ContentSlot[] => {
    const slots: ContentSlot[] = [];
    const platforms = ['Instagram', 'LinkedIn', 'Facebook', 'Twitter'];
    const contentTypes: ContentSlot['contentType'][] = ['post', 'story', 'reel', 'carousel'];
    
    // Generate 30 days of content
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Skip weekends for LinkedIn
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Generate 1-3 posts per day
      const postsPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < postsPerDay; j++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        
        // Optimal posting times by platform
        const optimalTimes = {
          Instagram: ['9:00 AM', '1:00 PM', '6:00 PM'],
          LinkedIn: ['8:00 AM', '12:00 PM', '5:00 PM'],
          Facebook: ['9:00 AM', '1:00 PM', '3:00 PM'],
          Twitter: ['8:00 AM', '12:00 PM', '5:00 PM', '7:00 PM']
        };
        
        const times = optimalTimes[platform as keyof typeof optimalTimes];
        const time = times[Math.floor(Math.random() * times.length)];
        
        slots.push({
          id: `slot-${i}-${j}`,
          date: date.toISOString().split('T')[0],
          time,
          platform,
          contentType,
          contentIdea: generateContentIdea(currentBrand?.businessType || 'business', contentType),
          hashtags: generateHashtags(currentBrand?.businessType || 'business'),
          estimatedReach: Math.floor(Math.random() * 2000) + 500,
          confidenceScore: Math.floor(Math.random() * 30) + 70,
          isOptimalTime: true,
          trendingTopics: ['AI Tools', 'Productivity', 'Innovation'],
          status: Math.random() > 0.7 ? 'draft' : 'scheduled'
        });
      }
    }
    
    return slots.slice(0, 20); // Return first 20 slots
  };

  const generateContentIdea = (businessType: string, contentType: ContentSlot['contentType']): string => {
    const ideas = {
      business: {
        post: [
          'Share a client success story and key takeaways',
          'Behind-the-scenes look at your team workflow',
          'Industry trend analysis and expert commentary',
          'Top 5 tips for business growth this quarter'
        ],
        story: [
          'Quick tip of the day for entrepreneurs',
          'Team member spotlight and their journey',
          'Before/after transformation showcase'
        ],
        reel: [
          'Day in the life of a business owner',
          'Quick tutorial on business automation',
          'Client testimonial compilation'
        ],
        carousel: [
          '7 mistakes every entrepreneur makes',
          'Step-by-step guide to process optimization',
          'Industry statistics that matter'
        ]
      },
      restaurant: {
        post: [
          'Feature today\'s special with chef insights',
          'Farm-to-table ingredient sourcing story',
          'Customer favorite dishes and their history'
        ],
        story: [
          'Kitchen prep behind the scenes',
          'Fresh ingredients arrival showcase',
          'Staff picks and recommendations'
        ],
        reel: [
          'Signature dish preparation time-lapse',
          'Customer reactions to new menu items',
          'Chef tips for home cooking'
        ],
        carousel: [
          'Complete menu highlights and prices',
          'Seasonal ingredient benefits',
          'Customer testimonials and photos'
        ]
      }
    };
    
    const typeIdeas = ideas[businessType as keyof typeof ideas] || ideas.business;
    const contentIdeas = typeIdeas[contentType] || typeIdeas.post;
    
    return contentIdeas[Math.floor(Math.random() * contentIdeas.length)];
  };

  const generateHashtags = (businessType: string): string[] => {
    const hashtagSets = {
      business: ['#BusinessGrowth', '#Entrepreneur', '#Success', '#Innovation', '#Leadership'],
      restaurant: ['#FreshFood', '#LocallySourced', '#ChefSpecial', '#Foodie', '#DineLocal'],
      fitness: ['#FitnessGoals', '#HealthyLiving', '#Workout', '#Wellness', '#Motivation']
    };
    
    return hashtagSets[businessType as keyof typeof hashtagSets] || hashtagSets.business;
  };

  const handleGenerateCalendar = async () => {
    setIsGenerating(true);
    try {
      toast({
        title: "Generating Smart Calendar",
        description: "AI is creating your 30-day content strategy..."
      });
      
      // Simulate AI calendar generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newSlots = generateMockCalendarSlots();
      setContentSlots(newSlots);
      
      toast({
        title: "Smart Calendar Generated! 🗓️",
        description: `Generated ${newSlots.length} optimized content slots for the next 30 days.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate calendar. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSlotAction = async (slotId: string, action: 'generate' | 'edit' | 'approve') => {
    const slot = contentSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    if (action === 'generate') {
      // Update slot status to generating
      setContentSlots(prev => prev.map(s => 
        s.id === slotId ? { ...s, status: 'generating' } : s
      ));
      
      // Simulate content generation
      setTimeout(() => {
        setContentSlots(prev => prev.map(s => 
          s.id === slotId ? { ...s, status: 'draft' } : s
        ));
        
        toast({
          title: "Content Generated!",
          description: `${slot.platform} ${slot.contentType} ready for review.`
        });
      }, 2000);
    }
  };

  const getSlotsForDate = (date: Date): ContentSlot[] => {
    const dateStr = date.toISOString().split('T')[0];
    return contentSlots.filter(slot => slot.date === dateStr);
  };

  const getStatusIcon = (status: ContentSlot['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-purple-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!user || !currentBrand) {
    return null;
  }

  return (
    <div className="flex-1 w-full space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Content Calendar</h1>
          <p className="text-muted-foreground">
            AI-powered 30-day content strategy for {currentBrand.businessName}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleGenerateCalendar}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                Generate Calendar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Calendar Settings
              </CardTitle>
              <CardDescription>
                Configure your automated content strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-Generate</Label>
                <Switch
                  checked={settings.autoGenerate}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoGenerate: checked }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Posts per Week: {settings.frequency}</Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.frequency}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, frequency: parseInt(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Instagram', 'LinkedIn', 'Facebook', 'Twitter'].map(platform => (
                    <div key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={platform}
                        checked={settings.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, platform]
                            }));
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== platform)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={platform} className="text-sm">
                        {platform}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Optimal Times Only</Label>
                <Switch
                  checked={settings.optimalTimesOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, optimalTimesOnly: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Include Trending Topics</Label>
                <Switch
                  checked={settings.includeTrending}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, includeTrending: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Calendar Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{contentSlots.length}</div>
                <p className="text-xs text-muted-foreground">Scheduled Posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {contentSlots.filter(s => s.status === 'draft').length}
                </div>
                <p className="text-xs text-muted-foreground">Ready to Post</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(contentSlots.reduce((sum, s) => sum + s.estimatedReach, 0) / 1000)}K
                </div>
                <p className="text-xs text-muted-foreground">Est. Total Reach</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(contentSlots.reduce((sum, s) => sum + s.confidenceScore, 0) / contentSlots.length)}%
                </div>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Slots */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Content</CardTitle>
              <CardDescription>
                Content slots for {selectedDate.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSlotsForDate(selectedDate).length > 0 ? (
                  getSlotsForDate(selectedDate).map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(slot.status)}
                          <Badge variant="outline">{slot.platform}</Badge>
                          <Badge variant="secondary">{slot.contentType}</Badge>
                          <span className="text-sm text-muted-foreground">{slot.time}</span>
                        </div>
                        
                        <p className="text-sm font-medium">{slot.contentIdea}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {slot.estimatedReach.toLocaleString()} reach
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {slot.confidenceScore}% confidence
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {slot.hashtags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {slot.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSlotAction(slot.id, 'generate')}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {slot.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSlotAction(slot.id, 'approve')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content scheduled for this date</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleGenerateCalendar}
                    >
                      Generate Content
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
