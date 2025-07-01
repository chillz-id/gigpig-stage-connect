
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/useEvents';
import { useUser } from '@/contexts/UserContext';
import { EventBasicInfo } from './EventBasicInfo';
import { EventDateTimeSection } from './EventDateTimeSection';
import { EventRequirementsSection } from './EventRequirementsSection';
import { EventSpotManagerDraggable } from './EventSpotManagerDraggable';
import { EventBannerUpload } from './EventBannerUpload';
import { EventTemplateLoader } from './EventTemplateLoader';
import { EventTemplateSaver } from './EventTemplateSaver';
import { EventTicketSection } from './EventTicketSection';
import { EventCostsSection } from './EventCostsSection';
import { EventFormData, RecurringSettings, EventSpot, EventCost } from '@/types/eventTypes';
import { validateEventForm } from '@/utils/eventValidation';
import { prepareEventData } from '@/utils/eventDataMapper';
import { loadTemplateData } from '@/utils/templateLoader';

const initialFormData: EventFormData = {
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
  requirements: [],
  isVerifiedOnly: false,
  isPaid: false,
  allowRecording: false,
  ageRestriction: '18+',
  dresscode: 'Casual',
  bannerUrl: '',
  showLevel: '',
  showType: '',
  customShowType: '',
  ticketingType: 'external', // Changed default to external
  externalTicketUrl: '',
  tickets: [],
  feeHandling: 'absorb',
  capacity: 0,
};

const initialRecurringSettings: RecurringSettings = {
  isRecurring: false,
  pattern: 'weekly',
  endDate: '',
  customDates: []
};

export const CreateEventForm: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createEvent, isCreating } = useEvents();
  const { user } = useUser();
  
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [eventSpots, setEventSpots] = useState<EventSpot[]>([]);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>(initialRecurringSettings);

  const handleFormDataChange = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleRecurringSettingsChange = (updates: Partial<RecurringSettings>) => {
    setRecurringSettings(prev => ({ ...prev, ...updates }));
  };

  const loadTemplate = (template: any) => {
    loadTemplateData(template, setFormData, setEventSpots, setRecurringSettings);
    toast({
      title: "Template loaded",
      description: `Template "${template.name}" has been loaded successfully.`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Auto-dismiss notification after 3 seconds
      const { dismiss } = toast({
        title: "Authentication required",
        description: "Please log in to create an event.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        dismiss();
      }, 3000);
      return;
    }

    const validation = validateEventForm(formData, recurringSettings);
    if (!validation.isValid) {
      toast({
        title: "Missing required fields",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const eventData = prepareEventData(formData, recurringSettings, eventSpots, user.id);
    createEvent(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-end">
        <EventTemplateLoader onLoadTemplate={loadTemplate} />
      </div>

      <EventBannerUpload 
        bannerUrl={formData.bannerUrl}
        onBannerChange={(url) => handleFormDataChange({ bannerUrl: url })}
      />

      <EventBasicInfo
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      <EventDateTimeSection
        formData={formData}
        recurringSettings={recurringSettings}
        onFormDataChange={handleFormDataChange}
        onRecurringSettingsChange={handleRecurringSettingsChange}
      />

      <EventSpotManagerDraggable 
        spots={eventSpots} 
        onSpotsChange={setEventSpots}
      />

      <EventTicketSection
        ticketingType={formData.ticketingType}
        externalTicketUrl={formData.externalTicketUrl}
        tickets={formData.tickets}
        feeHandling={formData.feeHandling}
        onTicketingTypeChange={(type) => handleFormDataChange({ ticketingType: type })}
        onExternalTicketUrlChange={(url) => handleFormDataChange({ externalTicketUrl: url })}
        onTicketsChange={(tickets) => handleFormDataChange({ tickets })}
        onFeeHandlingChange={(handling) => handleFormDataChange({ feeHandling: handling })}
      />

      <EventCostsSection
        costs={eventCosts}
        onCostsChange={setEventCosts}
      />

      <EventRequirementsSection
        formData={formData}
        onFormDataChange={handleFormDataChange}
      />

      <div className="flex gap-4 justify-end">
        <Button 
          type="button" 
          variant="destructive"
          onClick={() => navigate('/dashboard')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Cancel
        </Button>
        <EventTemplateSaver
          formData={formData}
          eventSpots={eventSpots}
          recurringSettings={recurringSettings}
        />
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
