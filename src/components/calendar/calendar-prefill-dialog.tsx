"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Zap, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceTemplate {
  serviceName: string;
  contentType: 'post' | 'story' | 'reel' | 'ad';
  platform: 'All' | 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface CalendarPrefillDialogProps {
  brandId: string;
  businessType: string;
  onPrefillComplete: () => void;
}

export function CalendarPrefillDialog({ brandId, businessType, onPrefillComplete }: CalendarPrefillDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedTab, setSelectedTab] = useState<'quick' | 'custom'>('quick');
  
  // Custom prefill options
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceTemplate[]>([]);
  
  const { toast } = useToast();

  // Load service templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      
      // Set default dates (today to 30 days from now)
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);
      
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(futureDate.toISOString().split('T')[0]);
    }
  }, [isOpen, businessType]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/calendar/prefill?businessType=${businessType}&brandId=${brandId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates);
        setSelectedServices(data.templates); // Select all by default
        
        // Show user which services are being used
        if (data.source === 'brand_services') {
          console.log('✅ Using your actual brand services for prefill');
        } else {
          console.log('⚠️ Using generic templates - no brand services found');
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleQuickPrefill = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Dialog: Starting quick prefill with templates:', templates.map(t => t.serviceName));
      
      // Use custom prefill with the templates we already loaded
      // This bypasses the API's brand service fetching which might be failing
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      
      const response = await fetch('/api/calendar/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          startDate: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          services: templates, // Use the templates we already successfully loaded
          pattern: { frequency: 'daily' },
          overwriteExisting: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Calendar Prefilled! 🎉",
          description: result.message
        });
        onPrefillComplete();
        setIsOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Prefill Failed",
          description: result.message
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prefill calendar"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrefill = async () => {
    if (!startDate || !endDate || selectedServices.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select dates and at least one service"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          startDate,
          endDate,
          services: selectedServices,
          overwriteExisting,
          pattern: { frequency: 'daily' } // Daily by default
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Calendar Prefilled! 🎉",
          description: result.message
        });
        onPrefillComplete();
        setIsOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Prefill Failed",
          description: result.message
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to prefill calendar"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (service: ServiceTemplate) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceName === service.serviceName);
      if (exists) {
        return prev.filter(s => s.serviceName !== service.serviceName);
      } else {
        return [...prev, service];
      }
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Prefill Calendar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prefill Calendar with Services
          </DialogTitle>
          <DialogDescription>
            Automatically populate your calendar with services for multiple days
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedTab('quick')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'quick'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Prefill (30 Days)
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('custom')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'custom'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              Custom Prefill
            </div>
          </button>
        </div>

        {selectedTab === 'quick' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Prefill - Next 30 Days</CardTitle>
              <CardDescription>
                Automatically add {businessType} services for the next 30 days using predefined templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.serviceName}</h4>
                      <Badge className={getPriorityColor(template.priority)}>
                        {template.priority || 'medium'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📱 {template.platform}</div>
                      <div>🎬 {template.contentType}</div>
                      {template.notes && <div>📝 {template.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">What will happen:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Create 1 random service per day for 30 days</li>
                  <li>• Total: 30 scheduled services (one per day)</li>
                  <li>• Each day features a different service randomly</li>
                  <li>• Random platforms and content types for variety</li>
                  <li>• Skip dates that already have services</li>
                  <li>• Use your actual brand services</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'custom' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Prefill</CardTitle>
              <CardDescription>
                Choose specific dates, services, and patterns for your calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={setOverwriteExisting}
                />
                <Label htmlFor="overwrite">Overwrite existing services</Label>
              </div>

              <Separator />

              {/* Service Selection */}
              <div>
                <Label className="text-base font-medium">Select Services to Add</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which services to add for each day in the date range
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template, index) => (
                    <div
                      key={index}
                      onClick={() => toggleService(template)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedServices.find(s => s.serviceName === template.serviceName)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.serviceName}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(template.priority)}>
                            {template.priority || 'medium'}
                          </Badge>
                          {selectedServices.find(s => s.serviceName === template.serviceName) && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>📱 {template.platform}</div>
                        <div>🎬 {template.contentType}</div>
                        {template.notes && <div>📝 {template.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Selected: {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
                  {startDate && endDate && (
                    <span className="ml-2">
                      • Total to create: {selectedServices.length * Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + selectedServices.length}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={selectedTab === 'quick' ? handleQuickPrefill : handleCustomPrefill}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Prefilling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                {selectedTab === 'quick' ? 'Quick Prefill 30 Days' : 'Custom Prefill'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
