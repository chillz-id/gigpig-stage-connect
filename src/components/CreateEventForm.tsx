
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/data/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  isVerifiedOnly: false, // Keep for backward compatibility but won't be shown in UI
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
  const { user, session } = useAuth();
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check current auth state and refresh if needed
    const { data: { user: currentUser, session: currentSession }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('=== CREATE EVENT: AUTH ERROR ===', authError);
      
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        toast({
          title: "Authentication required",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
    }
    
    if (!currentUser || !currentSession) {
      console.error('=== CREATE EVENT: NO AUTH ===', { 
        contextUser: !!user, 
        contextSession: !!session,
        currentUser: !!currentUser,
        currentSession: !!currentSession 
      });
      
      // Auto-dismiss notification after 3 seconds
      const { dismiss } = toast({
        title: "Authentication required",
        description: "Your session has expired. Please log in again to create an event.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        dismiss();
        navigate('/auth');
      }, 3000);
      return;
    }

    console.log('=== CREATE EVENT: AUTH CHECK PASSED ===', { userId: currentUser.id, email: currentUser.email });

    const validation = validateEventForm(formData, recurringSettings);
    if (!validation.isValid) {
      toast({
        title: "Missing required fields",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    console.log('=== CREATE EVENT: VALIDATION PASSED ===');
    const eventData = prepareEventData(formData, recurringSettings, eventSpots, currentUser.id);
    console.log('=== CREATE EVENT: CALLING CREATE EVENT ===', eventData);
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
          className="bg-primary hover:bg-primary/90"
        >
          {isCreating ? 'Publishing...' : 
           recurringSettings.isRecurring ? 'Publish Recurring Events' : 'Publish Event'}
        </Button>
      </div>
    </form>
  );
};
