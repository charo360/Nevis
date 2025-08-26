"use client";

import React, { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile } from "@/lib/types";
import type { CompleteBrandProfile } from "@/components/cbrand/cbrand-wizard";
import { useRouter } from "next/navigation";
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";
import { SidebarInset } from "@/components/ui/sidebar";

interface ScheduledContent {
  id: string;
  date: string;
  serviceId: string;
  serviceName: string;
  contentType: 'post' | 'story' | 'reel' | 'ad';
  platform: 'All' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';
  notes?: string;
  status: 'scheduled' | 'generated' | 'published';
}

interface Service {
  id: string;
  name: string;
  description: string;
}

// Predefined color palette for services on calendar (using hex colors for reliability)
const SERVICE_COLORS = [
  { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
  { bg: '#10B981', text: '#FFFFFF' }, // Green
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
  { bg: '#F97316', text: '#FFFFFF' }, // Orange
  { bg: '#EC4899', text: '#FFFFFF' }, // Pink
  { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
  { bg: '#EAB308', text: '#000000' }, // Yellow
  { bg: '#EF4444', text: '#FFFFFF' }, // Red
  { bg: '#14B8A6', text: '#FFFFFF' }, // Teal
  { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
  { bg: '#059669', text: '#FFFFFF' }, // Emerald
  { bg: '#7C3AED', text: '#FFFFFF' }, // Violet
  { bg: '#F59E0B', text: '#000000' }, // Amber
  { bg: '#F43F5E', text: '#FFFFFF' }, // Rose
  { bg: '#0EA5E9', text: '#FFFFFF' }, // Sky
];

function ContentCalendarPageContent() {
  const { currentBrand, brands, loading: brandLoading, selectBrand } = useUnifiedBrand();
  const scheduleStorage = useBrandStorage(STORAGE_FEATURES.CONTENT_CALENDAR);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load CBrand profile and services
  // Load content when brand changes using unified brand system
  useBrandChangeListener(React.useCallback((brand) => {
    const brandName = brand?.businessName || brand?.name || 'none';
    console.log('🔄 Content Calendar: brand changed to:', brandName);

    if (!brand) {
      setScheduledContent([]);
      setServices([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // CBrand services are already in the correct format: Array<{name: string, description: string}>
      if (brand.services && Array.isArray(brand.services)) {
        const serviceObjects = brand.services.map((service: any, index: number) => ({
          id: `service-${index}`,
          name: service.name || service,
          description: service.description || ''
        }));
        setServices(serviceObjects);
        console.log(`✅ Loaded ${serviceObjects.length} services for brand ${brandName}`);
      }

      // Load scheduled content from brand-scoped storage
      if (scheduleStorage) {
        const storedSchedule = scheduleStorage.getItem<ScheduledContent[]>() || [];
        setScheduledContent(storedSchedule);
        console.log(`✅ Loaded ${storedSchedule.length} scheduled items for brand ${brandName}`);
      }
    } catch (error) {
      console.error('Failed to load content calendar data for brand:', brandName, error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not read your content calendar data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [scheduleStorage, toast]));

  // Handle brand selection logic - only when truly needed
  useEffect(() => {
    if (!brandLoading) {
      // Only redirect if we're sure there are no brands AND no current brand is selected
      // This prevents premature redirects during the loading process
      if (!currentBrand && brands.length === 0) {
        console.log('🔄 Content Calendar: No brands found after loading completed, redirecting to brand setup');
        router.push('/brand-profile');
      } else if (currentBrand) {
        console.log(`✅ Content Calendar: Brand available: ${currentBrand.businessName || currentBrand.name}`);
      } else if (brands.length > 0) {
        console.log(`✅ Content Calendar: ${brands.length} brands available, waiting for brand selection`);
      }
      // Removed auto-selection to prevent unwanted brand switching
      // Let the unified brand context handle brand restoration from localStorage
    } else {
      console.log('🔄 Content Calendar: Still loading brands...');
    }
  }, [currentBrand, brands.length, brandLoading, router]);

  // Save scheduled content to brand-scoped storage
  const saveScheduledContent = (content: ScheduledContent[]) => {
    if (!scheduleStorage) {
      console.warn('No schedule storage available for current brand');
      return;
    }

    try {
      scheduleStorage.setItem(content);
      setScheduledContent(content);
      console.log(`💾 Saved ${content.length} scheduled items for brand ${currentBrand?.businessName || currentBrand?.name}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save scheduled content.",
      });
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const dayContent = scheduledContent.filter(content => content.date === dateStr);

      days.push({
        date: dateStr,
        day: currentDateObj.getDate(),
        isCurrentMonth,
        isToday,
        content: dayContent
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Schedule content for a specific date
  const scheduleContent = (date: string, serviceId: string, serviceName: string, contentType: string, platform: string, notes: string) => {
    const newContent: ScheduledContent = {
      id: `${date}-${serviceId}-${Date.now()}`,
      date,
      serviceId,
      serviceName,
      contentType: contentType as any,
      platform: platform as any,
      notes,
      status: 'scheduled'
    };

    const updatedContent = [...scheduledContent, newContent];
    saveScheduledContent(updatedContent);

    toast({
      title: "Content Scheduled",
      description: `${serviceName} content scheduled for ${new Date(date).toLocaleDateString()}`,
    });
  };

  // Remove scheduled content
  const removeScheduledContent = (contentId: string) => {
    const updatedContent = scheduledContent.filter(content => content.id !== contentId);
    saveScheduledContent(updatedContent);

    toast({
      title: "Content Removed",
      description: "Scheduled content has been removed.",
    });
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Calendar className="h-12 w-12 animate-pulse mx-auto mb-4" />
          <p>Loading content calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarInset fullWidth>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
          {/* Compact Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Content Calendar</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Schedule services for content generation
              </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm sm:text-lg font-semibold min-w-[140px] sm:min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Color-Coded Services Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Available Services
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                <span>Color-coded</span>
              </div>
            </CardTitle>
            <CardDescription className="text-sm">
              Each service has a unique color. Drag services to calendar days or click days to schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {services.map((service, index) => {
                // Create a preview color indicator
                const serviceColor = SERVICE_COLORS[index % SERVICE_COLORS.length];
                return (
                  <div
                    key={service.id}
                    className="cursor-move px-3 py-2 text-xs rounded-md border-2 border-dashed border-gray-300 bg-white transition-all hover:scale-105 hover:shadow-md"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('service', JSON.stringify(service));
                    }}
                    title={service.description}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: serviceColor.bg }}
                      ></div>
                      <div className="font-medium text-gray-800">{service.name}</div>
                    </div>
                    {service.description && (
                      <div className="text-xs text-gray-600 mt-1 truncate max-w-[150px] ml-5">
                        {service.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {services.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No services found. Please complete your brand profile to add services.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Responsive Calendar Grid */}
        <Card className="flex-1">
          <CardContent className="p-2 sm:p-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-1 text-center font-medium text-muted-foreground text-xs sm:text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={`
                  min-h-[70px] sm:min-h-[85px] p-1 sm:p-2 border rounded-sm sm:rounded-md transition-colors text-xs sm:text-sm
                  ${day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${day.isToday ? 'ring-1 sm:ring-2 ring-primary' : ''}
                  hover:bg-muted/50 cursor-pointer
                `}
                  onDrop={(e) => {
                    e.preventDefault();
                    const serviceData = e.dataTransfer.getData('service');
                    if (serviceData) {
                      const service = JSON.parse(serviceData);
                      setSelectedDate(day.date);
                      setIsScheduleDialogOpen(true);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setIsScheduleDialogOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs sm:text-sm font-medium ${day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {day.day}
                    </span>
                    {day.content.length > 0 && (
                      <Badge variant="outline" className="text-xs h-3 sm:h-4 px-1">
                        {day.content.length}
                      </Badge>
                    )}
                  </div>

                  {/* Color-Coded Scheduled Content */}
                  <div className="space-y-0.5">
                    {day.content.slice(0, 3).map((content) => {
                      // Find the service index to get its color
                      const serviceIndex = services.findIndex(s => s.id === content.serviceId);
                      const serviceColor = serviceIndex >= 0
                        ? SERVICE_COLORS[serviceIndex % SERVICE_COLORS.length]
                        : { bg: '#6B7280', text: '#FFFFFF' }; // Gray fallback

                      return (
                        <div
                          key={content.id}
                          className="text-xs px-2 py-1 rounded-md flex items-center justify-between group shadow-sm"
                          style={{
                            backgroundColor: serviceColor.bg,
                            color: serviceColor.text
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{content.serviceName}</div>
                            <div className="text-xs opacity-80">{content.platform}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 ml-1"
                            style={{ color: serviceColor.text }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeScheduledContent(content.id);
                            }}
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                      );
                    })}
                    {day.content.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.content.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Content Dialog */}
        <ScheduleContentDialog
          isOpen={isScheduleDialogOpen}
          onClose={() => setIsScheduleDialogOpen(false)}
          selectedDate={selectedDate}
          services={services}
          onSchedule={scheduleContent}
        />
        </div>
      </div>
    </div>
    </SidebarInset>
  );
}

// Schedule Content Dialog Component
interface ScheduleContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  services: Service[];
  onSchedule: (date: string, serviceId: string, serviceName: string, contentType: string, platform: string, notes: string) => void;
}

function ScheduleContentDialog({ isOpen, onClose, selectedDate, services, onSchedule }: ScheduleContentDialogProps) {
  const [selectedService, setSelectedService] = useState('');
  const [contentType, setContentType] = useState('post');
  const [platform, setPlatform] = useState('All');
  const [notes, setNotes] = useState('');

  const handleSchedule = () => {
    if (!selectedService) return;

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    onSchedule(selectedDate, selectedService, service.name, contentType, platform, notes);

    // Reset form
    setSelectedService('');
    setContentType('post');
    setPlatform('All');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Content</DialogTitle>
          <DialogDescription>
            Schedule content generation for {selectedDate ? new Date(selectedDate).toLocaleDateString() : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Feed Post (Regular Daily Post)</SelectItem>
                <SelectItem value="story">Story (24-hour content)</SelectItem>
                <SelectItem value="reel">Reel/Video (Short-form video)</SelectItem>
                <SelectItem value="ad">Advertisement (Paid promotion)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Platforms</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Twitter">Twitter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or notes for this content..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={!selectedService}>
              Schedule Content
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentCalendarPage() {
  return (
    <BrandContent fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Brand Selected</h2>
          <p className="text-gray-600">Please select a brand to view and manage your content calendar.</p>
        </div>
      </div>
    }>
      {() => <ContentCalendarPageContent />}
    </BrandContent>
  );
}

function ContentCalendarPageWithUnifiedBrand() {
  return (
    <UnifiedBrandLayout>
      <ContentCalendarPage />
      <BrandSwitchingStatus />
    </UnifiedBrandLayout>
  );
}

export default ContentCalendarPageWithUnifiedBrand;
