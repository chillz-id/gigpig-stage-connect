
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/useEvents';
import { useUser } from '@/contexts/UserContext';
import { EventBasicInfo } from './EventBasicInfo';
import { EventDateTimeSection } from './EventDateTimeSection';
import { EventRequirementsSection } from './EventRequirementsSection';
import { EventSpotManagerFixed } from './EventSpotManagerFixed';
import { EventBannerUpload } from './EventBannerUpload';
import { EventTemplateManager } from './EventTemplateManager';

export const CreateEventForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createEvent, isCreating } = useEvents();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    country: 'Australia',
    date: '',
    time: '',
    endTime: '',
    type: '',
    spots: 5,
    description: '',
    requirements: [] as string[],
    isVerifiedOnly: false,
    isPaid: false,
    allowRecording: false,
    ageRestriction: '18+',
    dresscode: 'Casual',
    bannerUrl: '',
  });

  const [eventSpots, setEventSpots] = useState<Array<{
    spot_name: string;
    is_paid: boolean;
    payment_amount?: number;
    currency: string;
    duration_minutes?: number;
  }>>([]);

  const [recurringSettings, setRecurringSettings] = useState({
    isRecurring: false,
    pattern: 'weekly',
    endDate: '',
    customDates: [] as Date[]
  });

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleRecurringSettingsChange = (updates: Partial<typeof recurringSettings>) => {
    setRecurringSettings(prev => ({ ...prev, ...updates }));
  };

  const loadTemplate = (template: any) => {
    const data = template.template_data;
    setFormData({
      title: data.title || '',
      venue: data.venue || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'Australia',
      date: '',
      time: data.time || '',
      endTime: data.endTime || '',
      type: data.type || '',
      spots: data.spots || 5,
      description: data.description || '',
      requirements: data.requirements || [],
      isVerifiedOnly: data.isVerifiedOnly || false,
      isPaid: data.isPaid || false,
      allowRecording: data.allowRecording || false,
      ageRestriction: data.ageRestriction || '18+',
      dresscode: data.dresscode || 'Casual',
      bannerUrl: data.bannerUrl || '',
    });
    
    if (data.spots && Array.isArray(data.spots)) {
      setEventSpots(data.spots);
    }
    
    if (data.recurringSettings) {
      // Convert ISO strings back to Date objects
      setRecurringSettings({
        ...data.recurringSettings,
        customDates: data.recurringSettings.customDates 
          ? data.recurringSettings.customDates.map((dateStr: string) => new Date(dateStr))
          : []
      });
    }

    toast({
      title: "Template loaded",
      description: `Template "${template.name}" has been loaded successfully.`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an event.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.title || !formData.venue || !formData.date || !formData.time) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (recurringSettings.isRecurring && recurringSettings.pattern !== 'custom' && !recurringSettings.endDate) {
      toast({
        title: "Missing recurring end date",
        description: "Please specify when the recurring events should end.",
        variant: "destructive",
      });
      return;
    }

    if (recurringSettings.isRecurring && recurringSettings.pattern === 'custom' && recurringSettings.customDates.length === 0) {
      toast({
        title: "No custom dates selected",
        description: "Please select at least one date for custom recurring events.",
        variant: "destructive",
      });
      return;
    }

    const eventDateTime = new Date(`${formData.date}T${formData.time}`);

    const eventData = {
      promoter_id: user.id,
      title: formData.title,
      venue: formData.venue,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      event_date: eventDateTime.toISOString(),
      start_time: formData.time,
      end_time: formData.endTime || null,
      type: formData.type,
      description: formData.description,
      requirements: formData.requirements.join('\n'),
      is_verified_only: formData.isVerifiedOnly,
      is_paid: formData.isPaid,
      allow_recording: formData.allowRecording,
      age_restriction: formData.ageRestriction,
      dress_code: formData.dresscode,
      banner_url: formData.bannerUrl || null,
      isRecurring: recurringSettings.isRecurring,
      recurrencePattern: recurringSettings.isRecurring ? recurringSettings.pattern : undefined,
      recurrenceEndDate: recurringSettings.isRecurring && recurringSettings.pattern !== 'custom' ? recurringSettings.endDate : undefined,
      customDates: recurringSettings.isRecurring && recurringSettings.pattern === 'custom' ? recurringSettings.customDates : undefined,
      spotDetails: eventSpots
    };

    console.log('Creating event:', eventData);
    createEvent(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Template Manager */}
      <div className="flex justify-end">
        <EventTemplateManager
          formData={formData}
          eventSpots={eventSpots}
          recurringSettings={recurringSettings}
          onLoadTemplate={loadTemplate}
        />
      </div>

      {/* Basic Information */}
      <EventBasicInfo
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      {/* Event Banner */}
      <EventBannerUpload 
        bannerUrl={formData.bannerUrl}
        onBannerChange={(url) => handleFormDataChange({ bannerUrl: url })}
      />

      {/* Date & Time */}
      <EventDateTimeSection
        formData={formData}
        recurringSettings={recurringSettings}
        onFormDataChange={handleFormDataChange}
        onRecurringSettingsChange={handleRecurringSettingsChange}
      />

      {/* Event Spots Management */}
      <EventSpotManagerFixed 
        spots={eventSpots} 
        onSpotsChange={setEventSpots}
      />

      {/* Requirements & Settings */}
      <EventRequirementsSection
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="text-white border-white/30 hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isCreating}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isCreating ? 'Publishing...' : 
           recurringSettings.isRecurring ? 'Publish Recurring Events' : 'Publish Event'}
        </Button>
      </div>
    </form>
  );
};
