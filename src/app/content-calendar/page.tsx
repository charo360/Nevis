"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useUnifiedBrand, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";
import { BrandContent } from "@/components/layout/unified-brand-layout";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { DesktopSidebarTrigger } from "@/components/layout/desktop-sidebar-trigger";
import { CalendarPrefillDialog } from "@/components/calendar/calendar-prefill-dialog";

// Types
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
  // Contexts and hooks
  const { currentBrand, brands, loading: brandLoading, getBrandStorage } = useUnifiedBrand();
  const getScheduleStorage = () => getBrandStorage(STORAGE_FEATURES.CONTENT_CALENDAR);
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<'post' | 'story' | 'reel' | 'ad'>('post');
  const [selectedPlatform, setSelectedPlatform] = useState<'All' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter'>('All');
  const [selectedNotes, setSelectedNotes] = useState<string>('');
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignDay, setReassignDay] = useState<string>('');
  const [reassignService, setReassignService] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Ref for current brandId
  const currentBrandIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentBrandIdRef.current = currentBrand?.id || null;
  }, [currentBrand?.id]);

  // Load content when brand changes
  useBrandChangeListener(useCallback((brand) => {
    setScheduledContent([]);
    setServices([]);
    setIsLoading(true);

    if (!brand) {
      setIsLoading(false);
      return;
    }

    // Always clear local calendar data for DB mode
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('content-calendar_')) localStorage.removeItem(key);
    });

    const currentStorage = getScheduleStorage();
    if (currentStorage) currentStorage.removeItem();

    setTimeout(() => {
      try {
        if (brand.services && Array.isArray(brand.services)) {
          const serviceObjects = brand.services.map((service: any, index: number) => ({
            id: `${brand.id}-service-${index}`,
            name: service.name || service,
            description: service.description || ''
          }));
          setServices(serviceObjects);

          // DB mode: always load from server
          fetch(`/api/calendar?brandId=${brand.id}`)
            .then(response => response.json())
            .then(data => {
              // Transform database format to frontend format
              const transformedData = (data || []).map((item: any) => ({
                id: item.id.toString(),
                date: item.date,
                serviceId: item.id.toString(), // Use database ID as serviceId
                serviceName: item.service_name, // Transform snake_case to camelCase
                contentType: item.content_type,
                platform: item.platform,
                notes: item.notes,
                status: item.status
              }));
              console.log('📅 Loaded calendar data:', transformedData);
              setScheduledContent(transformedData);
            })
            .catch(() => setScheduledContent([]));
        } else {
          setServices([]);
          setScheduledContent([]);
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Could not read your content calendar data.",
        });
      } finally {
        setIsLoading(false);
      }
    }, 150);
  }, [toast, getBrandStorage]));

  useEffect(() => {
    if (!brandLoading && !currentBrand && brands.length === 0) {
      router.push('/brand-profile');
    }
  }, [currentBrand, brands.length, brandLoading, router]);

  // Save scheduled content to brand-scoped storage
  const saveScheduledContent = (content: ScheduledContent[]) => {
    const currentBrandId = currentBrandIdRef.current;
    if (!currentBrandId) return;
    const currentStorage = getScheduleStorage();
    if (!currentStorage) return;
    try {
      currentStorage.setItem(content);
      setScheduledContent(content);
      window.dispatchEvent(new CustomEvent('calendarDataChanged', {
        detail: {
          brandId: currentBrandId,
          contentCount: content.length,
          timestamp: Date.now()
        }
      }));
    } catch {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save scheduled content.",
      });
    }
  };

  // Calendar grid and navigation
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Schedule content for a date
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

  // Change service for a day (one service per day approach)
  const handleReassignService = () => {
    if (!reassignDay || !reassignService) return;
    const selectedServiceObj = services.find(s => s.id === reassignService);
    if (!selectedServiceObj) return;
    
    // Remove existing content for this day
    const updatedContent = scheduledContent.filter(item => item.date !== reassignDay);
    
    // Create ONE new service for the day with random platform and content type
    const platforms: ('Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter')[] = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter'];
    const contentTypes: ('post' | 'story' | 'reel' | 'ad')[] = ['post', 'story', 'reel'];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    const randomContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    
    const newContent: ScheduledContent = {
      id: `changed-${selectedServiceObj.id}-${reassignDay}-${Date.now()}`,
      date: reassignDay,
      serviceId: selectedServiceObj.id,
      serviceName: selectedServiceObj.name,
      contentType: randomContentType,
      platform: randomPlatform,
      notes: `Changed to ${selectedServiceObj.name}`,
      status: "scheduled"
    };
    
    // Save to database via API
    updateCalendarInDatabase(reassignDay, selectedServiceObj.name, randomContentType, randomPlatform, `Changed to ${selectedServiceObj.name}`);
    
    saveScheduledContent([...updatedContent, newContent]);
    setReassignDialogOpen(false);
    setReassignDay('');
    setReassignService('');
    toast({
      title: "Service Changed! 🔄",
      description: `${new Date(reassignDay).toLocaleDateString()} now features "${selectedServiceObj.name}" (${randomPlatform} ${randomContentType})`,
    });
  };

  // Update calendar in database
  const updateCalendarInDatabase = async (date: string, serviceName: string, contentType: string, platform: string, notes: string) => {
    if (!currentBrand?.id) return;
    
    try {
      // First, delete existing entries for this date
      const existingResponse = await fetch(`/api/calendar?brandId=${currentBrand.id}&date=${date}`);
      const existingData = await existingResponse.json();
      
      // Delete existing entries
      for (const item of existingData) {
        await fetch('/api/calendar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id })
        });
      }
      
      // Create new entry
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentBrand.id,
          serviceName,
          date,
          contentType,
          platform,
          notes
        })
      });
      
      console.log(`✅ Updated database: ${date} → ${serviceName} (${platform} ${contentType})`);
      
      // Force refresh calendar cache by updating localStorage timestamp
      localStorage.setItem('calendarLastUpdated', Date.now().toString());
      console.log('🔄 Calendar cache invalidated - other pages will refresh');
      
    } catch (error) {
      console.error('❌ Failed to update database:', error);
    }
  };

  const openReassignDialog = (day: string) => {
    setReassignDay(day);
    setReassignDialogOpen(true);
  };

  // UI helpers
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const calendarDays = generateCalendarDays();

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

  const brandKey = currentBrand?.id || currentBrand?.businessName || 'no-brand';
  const calendarKey = `calendar-${brandKey}`;

  // ENCLOSE main content in flex min-h-screen ...
  return (
    <div className="flex min-h-screen flex-col bg-background transition-all duration-200 ease-linear w-full ml-0 flex-1" key={calendarKey}>
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Content Calendar</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Schedule services for content generation - Click services to edit, use Generate Content to create posts
                </p>
               
              </div>
              <div className="flex items-center gap-2">
                {currentBrand && (
                  <CalendarPrefillDialog
                    brandId={currentBrand.id}
                    businessType={currentBrand.businessType || 'default'}
                    onPrefillComplete={() => {
                      // Refresh calendar data after prefill
                      if (currentBrand) {
                        fetch(`/api/calendar?brandId=${currentBrand.id}`)
                          .then(response => response.json())
                          .then(data => {
                            // Transform database format to frontend format
                            const transformedData = (data || []).map((item: any) => ({
                              id: item.id.toString(),
                              date: item.date,
                              serviceId: item.id.toString(),
                              serviceName: item.service_name, // Transform snake_case to camelCase
                              contentType: item.content_type,
                              platform: item.platform,
                              notes: item.notes,
                              status: item.status
                            }));
                            console.log('📅 Refreshed calendar data after prefill:', transformedData);
                            setScheduledContent(transformedData);
                          })
                          .catch(() => setScheduledContent([]));
                      }
                    }}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScheduledContent([]);
                    setServices([]);
                    setIsLoading(true);
                    const storage = getScheduleStorage();
                    if (storage) storage.removeItem();
                    if (currentBrand) {
                      const event = new CustomEvent('brandChanged', { detail: { brand: currentBrand } });
                      window.dispatchEvent(event);
                    }
                  }}
                  className="text-xs"
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentBrandId = currentBrand?.id;
                    const currentBrandName = currentBrand?.businessName || currentBrand?.name;
                    if (currentBrandId) {
                      const currentBrandKey = `content-calendar_${currentBrandId}`;
                      localStorage.removeItem(currentBrandKey);
                    }
                    setScheduledContent([]);
                    setServices([]);
                    setIsLoading(true);
                    toast({
                      title: "Current Brand Cleared",
                      description: `Calendar data cleared for ${currentBrandName || 'current brand'}.`,
                    });
                  }}
                  className="text-xs"
                >
                  Clear Current
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentBrandId = currentBrand?.id;
                    const currentBrandName = currentBrand?.businessName || currentBrand?.name;
                    const allKeys = Object.keys(localStorage);
                    allKeys.forEach(key => {
                      if (key.startsWith('content-calendar_')) {
                        localStorage.removeItem(key);
                      }
                    });
                    setScheduledContent([]);
                    setServices([]);
                    setIsLoading(true);
                    if (currentBrand) {
                      localStorage.setItem('currentBrandData', JSON.stringify(currentBrand));
                    }
                    toast({
                      title: "All Calendar Data Cleared",
                      description: `All calendar data cleared. Staying on ${currentBrandName || 'current brand'}.`,
                    });
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
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

            {/* Service Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Your Services (Auto-distributed)
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                    <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                    <span>Color-coded</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-sm">
                  Services from your brand profile are automatically distributed across the calendar for content generation. Click to edit or add more.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => {
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
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: serviceColor.bg }}></div>
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

            {/* Calendar Grid */}
            <Card className="flex-1 mt-4">
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
                      <div className="space-y-0.5">
                        {day.content.slice(0, 3).map((content) => {
                          const serviceIndex = services.findIndex(s => s.id === content.serviceId);
                          const serviceColor = serviceIndex >= 0
                            ? SERVICE_COLORS[serviceIndex % SERVICE_COLORS.length]
                            : { bg: '#6B7280', text: '#FFFFFF' };
                          return (
                            <div
                              key={content.id}
                              className="text-xs px-2 py-1 rounded-md flex items-center justify-between group shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
                              style={{
                                backgroundColor: serviceColor.bg,
                                color: serviceColor.text
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(day.date);
                                setSelectedService(content.serviceId);
                                setSelectedContentType(content.contentType);
                                setSelectedPlatform(content.platform);
                                setSelectedNotes(content.notes || '');
                                setIsScheduleDialogOpen(true);
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{content.serviceName}</div>
                                <div className="text-xs opacity-80 flex items-center gap-1">
                                  <span>{content.platform}</span>
                                  <span>•</span>
                                  <span className="capitalize">{content.contentType}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                  style={{ color: serviceColor.text }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(day.date);
                                    setSelectedService(content.serviceId);
                                    setSelectedContentType(content.contentType);
                                    setSelectedPlatform(content.platform);
                                    setSelectedNotes(content.notes || '');
                                    setIsScheduleDialogOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-2 w-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                  style={{ color: serviceColor.text }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeScheduledContent(content.id);
                                  }}
                                >
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {day.content.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{day.content.length - 3} more
                          </div>
                        )}
                        <div className="flex gap-1 mt-1">
                          {day.content.length > 0 ? (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 text-xs h-6 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const serviceIds = day.content.map(c => c.serviceId);
                                  const serviceNames = day.content.map(c => c.serviceName);
                                  const brandId = currentBrand?.id || '';
                                  const brandName = currentBrand?.businessName || currentBrand?.name || '';
                                  const encodedServiceNames = serviceNames.map(name => encodeURIComponent(name)).join(',');
                                  const encodedServiceIds = serviceIds.join(',');
                                  router.push(`/quick-content?services=${encodedServiceIds}&date=${day.date}&serviceNames=${encodedServiceNames}&brandId=${brandId}&brandName=${encodeURIComponent(brandName)}`);
                                }}
                              >
                                Generate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReassignDialog(day.date);
                                }}
                              >
                                Change
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReassignDialog(day.date);
                              }}
                            >
                              Add Service
                            </Button>
                          )}
                        </div>
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
            {/* Service Reassignment Dialog */}
            <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Service for Day {reassignDay}</DialogTitle>
                  <DialogDescription>
                    Select a different service to schedule for this day. This will replace all existing content.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Service</Label>
                    <Select value={reassignService} onValueChange={setReassignService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a service..." />
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReassignDialogOpen(false);
                        setReassignDay('');
                        setReassignService('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReassignService}
                      disabled={!reassignService}
                    >
                      Change Service
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
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
    <>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
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
    </>
  );
}

export default ContentCalendarPage;