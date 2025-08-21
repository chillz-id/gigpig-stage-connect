import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { EventFormData, RecurringSettings, EventSpot, EventCost } from '@/types/eventTypes';
import { supabase } from '@/integrations/supabase/client';
import { withNetworkErrorHandling } from '@/utils/eventNetworkErrorHandler';
import { prepareEventData } from '@/utils/eventDataMapper';
import { validateEventForm } from '@/utils/eventValidation';
import { loadTemplateData } from '@/utils/templateLoader';
import { Tables } from '@/integrations/supabase/types';

type EventTemplate = Tables<'event_templates'>;

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  venue: z.string().min(1, 'Venue name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('Australia'),
  date: z.string().min(1, 'Event date is required'),
  time: z.string().min(1, 'Event time is required'),
  endTime: z.string().optional(),
  type: z.string().optional(),
  spots: z.number().min(1, 'At least 1 spot is required').default(5),
  description: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  isVerifiedOnly: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  allowRecording: z.boolean().default(false),
  ageRestriction: z.string().default('18+'),
  dresscode: z.string().default('Casual'),
  imageUrl: z.string().optional(),
  showLevel: z.string().optional(),
  showType: z.string().optional(),
  customShowType: z.string().optional(),
  ticketingType: z.enum(['external', 'internal']).default('external'),
  externalTicketUrl: z.string().optional(),
  tickets: z.array(z.any()).default([]),
  feeHandling: z.enum(['absorb', 'pass']).default('absorb'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

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
  imageUrl: '',
  showLevel: '',
  showType: '',
  customShowType: '',
  ticketingType: 'external',
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

export const useCreateEventForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createEvent, isCreating } = useCreateEvent();
  const { user, session } = useAuth();

  // Additional state not handled by react-hook-form
  const [eventSpots, setEventSpots] = useState<EventSpot[]>([]);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>(initialRecurringSettings);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialFormData,
    mode: 'onChange',
  });

  const handleAddressSelect = (address: string, placeDetails?: any) => {
    form.setValue('address', address);
    
    if (placeDetails?.address_components) {
      let city = '';
      let state = '';
      
      placeDetails.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
      });
      
      if (city) form.setValue('city', city);
      if (state) form.setValue('state', state);
    }
  };

  const loadTemplate = (template: EventTemplate) => {
    try {
      // Get current imageUrl to preserve user's uploaded banner
      const currentImageUrl = form.getValues('imageUrl');
      
      // Use the dedicated template loader utility
      loadTemplateData(
        template,
        (formData) => form.reset(formData),
        setEventSpots,
        setRecurringSettings,
        currentImageUrl
      );
      
      toast({
        title: "Template loaded",
        description: `Template "${template.name}" has been loaded successfully.`
      });
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: "Template load failed",
        description: "Failed to load template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateAndSubmit = async (data: EventFormData, status: 'draft' | 'open' = 'open') => {
    try {
      // Double-check current auth state
      const { data: { user: currentUser, session: currentSession }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser || !currentSession) {
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

      // Use existing validation logic
      const validation = validateEventForm(data, recurringSettings);
      if (!validation.isValid) {
        toast({
          title: "Missing required fields",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      // Prepare event data
      const eventData = prepareEventData(data, recurringSettings, eventSpots, currentUser!.id);
      eventData.status = status;
      
      // Submit with network error handling
      await withNetworkErrorHandling(
        async () => {
          const result = await createEvent(eventData);
          
          // If creating a draft and it succeeds, enable auto-save
          if (status === 'draft' && result?.id) {
            setCurrentEventId(result.id);
            setAutoSaveEnabled(true);
            
            // Clear localStorage since we now have a saved draft
            if (typeof window !== 'undefined') {
              localStorage.removeItem('event_draft');
            }
          } else if (status === 'open' && result?.id) {
            // Clear auto-save state and localStorage on successful publish
            setCurrentEventId(null);
            setAutoSaveEnabled(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('event_draft');
            }
          }
          
          return result;
        },
        {
          operation: 'create_event',
          eventTitle: eventData.title,
          additionalData: {
            venue: eventData.venue,
            date: eventData.event_date,
          },
        }
      );

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onSubmit = (data: EventFormData) => validateAndSubmit(data, 'open');
  const onSaveDraft = (data: EventFormData) => validateAndSubmit(data, 'draft');

  // Method to enable auto-save after initial draft creation
  const enableAutoSave = () => {
    return autoSaveEnabled;
  };

  return {
    form,
    eventSpots,
    setEventSpots,
    eventCosts,
    setEventCosts,
    recurringSettings,
    setRecurringSettings,
    isCreating,
    handleAddressSelect,
    loadTemplate,
    onSubmit,
    onSaveDraft,
    navigate,
    // Auto-save related
    currentEventId,
    autoSaveEnabled,
    enableAutoSave,
  };
};