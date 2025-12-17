import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { useDuplicateDetection, DuplicateCandidate } from '@/hooks/useDuplicateDetection';
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
  doorsTime: z.string().optional(),
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
  doorsTime: '',
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

  // Duplicate detection
  const {
    checkDuplicates,
    mergeData,
    duplicateResult,
    isChecking: isCheckingDuplicates,
    isLinking: isMergingData,
    reset: resetDuplicateDetection,
    skipDuplicateCheck,
    wasSkipped: duplicateCheckSkipped,
  } = useDuplicateDetection();

  // Additional state not handled by react-hook-form
  const [eventSpots, setEventSpots] = useState<EventSpot[]>([]);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [recurringSettings, setRecurringSettings] = useState<RecurringSettings>(initialRecurringSettings);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Duplicate detection dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    data: EventFormData;
    status: 'draft' | 'open';
  } | null>(null);

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

  // Internal submit function that bypasses duplicate check (called after user confirms)
  const performSubmit = useCallback(async (data: EventFormData, status: 'draft' | 'open' = 'open') => {
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
  }, [createEvent, eventSpots, navigate, recurringSettings, toast]);

  const validateAndSubmit = async (data: EventFormData, status: 'draft' | 'open' = 'open') => {
    // Skip duplicate check for drafts or if already skipped
    if (status === 'draft' || duplicateCheckSkipped) {
      await performSubmit(data, status);
      return;
    }

    // Skip duplicate check for recurring events (too complex to match)
    if (recurringSettings.isRecurring) {
      await performSubmit(data, status);
      return;
    }

    // Check for duplicates before creating
    if (data.date && data.title) {
      try {
        const result = await checkDuplicates(data.title, data.date);

        if (result.hasDuplicates && result.candidates.length > 0) {
          // Store pending submission and show dialog
          setPendingSubmission({ data, status });
          setShowDuplicateDialog(true);
          return;
        }
      } catch (error) {
        // If duplicate check fails, proceed with creation anyway
        console.warn('Duplicate check failed, proceeding with creation:', error);
      }
    }

    // No duplicates found, proceed with creation
    await performSubmit(data, status);
  };

  // Handler when user selects a synced event from duplicates
  const handleSelectSyncedEvent = useCallback(async (candidate: DuplicateCandidate) => {
    if (!pendingSubmission) return;

    // Merge platform data into the synced event
    const platformData = {
      description: pendingSubmission.data.description,
      banner_url: pendingSubmission.data.imageUrl,
      requirements: pendingSubmission.data.requirements?.join(', '),
      spots: pendingSubmission.data.spots,
    };

    const success = await mergeData(candidate.id, platformData);

    if (success) {
      toast({
        title: "Event linked",
        description: `Your event details have been merged with the existing "${candidate.title}" event.`,
      });

      // Navigate to the synced event
      navigate(`/admin/events/${candidate.id}`);
    } else {
      toast({
        title: "Merge failed",
        description: "Failed to merge event data. Please try again.",
        variant: "destructive",
      });
    }

    // Clean up
    setShowDuplicateDialog(false);
    setPendingSubmission(null);
    resetDuplicateDetection();
  }, [mergeData, navigate, pendingSubmission, resetDuplicateDetection, toast]);

  // Handler when user wants to create new event despite duplicates
  const handleCreateNewAnyway = useCallback(async () => {
    if (!pendingSubmission) return;

    // Skip future duplicate checks for this submission
    skipDuplicateCheck();
    setShowDuplicateDialog(false);

    // Proceed with creation
    await performSubmit(pendingSubmission.data, pendingSubmission.status);

    // Clean up
    setPendingSubmission(null);
    resetDuplicateDetection();
  }, [pendingSubmission, performSubmit, resetDuplicateDetection, skipDuplicateCheck]);

  // Handler to dismiss duplicate dialog
  const handleDismissDuplicateDialog = useCallback(() => {
    setShowDuplicateDialog(false);
    setPendingSubmission(null);
    resetDuplicateDetection();
  }, [resetDuplicateDetection]);

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
    // Duplicate detection
    showDuplicateDialog,
    duplicateCandidates: duplicateResult?.candidates ?? [],
    isCheckingDuplicates,
    isMergingData,
    pendingEventData: pendingSubmission?.data ?? null,
    handleSelectSyncedEvent,
    handleCreateNewAnyway,
    handleDismissDuplicateDialog,
  };
};