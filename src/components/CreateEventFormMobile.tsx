/**
 * CreateEventFormMobile Component
 *
 * Mobile-optimized event creation form using wizard pattern with:
 * - Step-by-step navigation (8 steps)
 * - Auto-save draft between steps
 * - Progress indicator
 * - Touch-friendly controls
 * - Validation per step
 * - Existing section components wrapped in wizard
 */

import React, { createContext, useContext } from 'react';
import { FormProvider } from 'react-hook-form';
import { MobileFormWizard, WizardStep, WizardStepProps } from './forms/MobileFormWizard';
import { MobileFormSection } from './forms/MobileFormSection';
import { useCreateEventForm } from '@/hooks/useCreateEventForm';
import { BasicEventInfo } from './BasicEventInfo';
import { VenueSelection } from './VenueSelection';
import { EventScheduling } from './EventScheduling';
import { PerformerRequirements } from './PerformerRequirements';
import { TicketingInfo } from './TicketingInfo';
import { EventSpotManagerDraggable } from './EventSpotManagerDraggable';
import { EventBannerUpload } from './EventBannerUpload';
import { EventCostsSection } from './EventCostsSection';
import { EventTemplateLoader } from './EventTemplateLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

// Create context for form data shared across wizard steps
const EventFormContext = createContext<ReturnType<typeof useCreateEventForm> | null>(null);

const useEventFormContext = () => {
  const context = useContext(EventFormContext);
  if (!context) {
    throw new Error('useEventFormContext must be used within EventFormContext.Provider');
  }
  return context;
};

// Step 1: Basic Event Info
const BasicInfoStep: React.FC<WizardStepProps> = () => {
  const { form } = useEventFormContext();
  const { control, formState: { errors } } = form;

  return (
    <MobileFormSection
      title="Event Details"
      description="Tell us about your comedy event"
      required
    >
      <BasicEventInfo control={control} errors={errors} />
    </MobileFormSection>
  );
};

// Step 2: Event Banner
const BannerStep: React.FC<WizardStepProps> = () => {
  const { form } = useEventFormContext();

  return (
    <MobileFormSection
      title="Event Banner"
      description="Upload a banner image for your event"
    >
      <EventBannerUpload
        imageUrl={form.watch('imageUrl') || ''}
        onImageChange={(url) => form.setValue('imageUrl', url)}
      />
    </MobileFormSection>
  );
};

// Step 3: Venue Selection
const VenueStep: React.FC<WizardStepProps> = () => {
  const { form, handleAddressSelect } = useEventFormContext();
  const { control, formState: { errors } } = form;

  return (
    <MobileFormSection
      title="Venue & Location"
      description="Where will the event take place?"
      required
    >
      <VenueSelection
        control={control}
        errors={errors}
        onAddressSelect={handleAddressSelect}
      />
    </MobileFormSection>
  );
};

// Step 4: Event Scheduling
const SchedulingStep: React.FC<WizardStepProps> = () => {
  const { form, recurringSettings, setRecurringSettings } = useEventFormContext();
  const { control, formState: { errors } } = form;

  return (
    <MobileFormSection
      title="Date & Time"
      description="When will the event happen?"
      required
    >
      <EventScheduling
        control={control}
        errors={errors}
        recurringSettings={recurringSettings}
        onRecurringSettingsChange={setRecurringSettings}
      />
    </MobileFormSection>
  );
};

// Step 5: Performer Spots
const SpotsStep: React.FC<WizardStepProps> = () => {
  const { eventSpots, setEventSpots } = useEventFormContext();

  return (
    <MobileFormSection
      title="Performance Spots"
      description="Define the spots available for comedians"
      required
    >
      <EventSpotManagerDraggable
        spots={eventSpots}
        onSpotsChange={setEventSpots}
      />
    </MobileFormSection>
  );
};

// Step 6: Ticketing
const TicketingStep: React.FC<WizardStepProps> = () => {
  const { form } = useEventFormContext();
  const { control, formState: { errors } } = form;

  return (
    <MobileFormSection
      title="Ticketing"
      description="Configure ticket sales and pricing"
    >
      <TicketingInfo control={control} errors={errors} />
    </MobileFormSection>
  );
};

// Step 7: Event Costs
const CostsStep: React.FC<WizardStepProps> = () => {
  const { eventCosts, setEventCosts } = useEventFormContext();

  return (
    <MobileFormSection
      title="Event Costs"
      description="Track expenses and budget for this event"
    >
      <EventCostsSection
        costs={eventCosts}
        onCostsChange={setEventCosts}
      />
    </MobileFormSection>
  );
};

// Step 8: Performer Requirements
const RequirementsStep: React.FC<WizardStepProps> = () => {
  const { form } = useEventFormContext();
  const { control, formState: { errors } } = form;

  return (
    <MobileFormSection
      title="Performer Requirements"
      description="Set requirements for applicants"
    >
      <PerformerRequirements control={control} errors={errors} />
    </MobileFormSection>
  );
};

// Summary Step
const SummaryStep: React.FC<WizardStepProps> = () => {
  const { form, eventSpots, recurringSettings } = useEventFormContext();
  const formData = form.watch();

  return (
    <MobileFormSection
      title="Review & Publish"
      description="Review your event before publishing"
    >
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{formData.title || 'Untitled Event'}</p>
                <p className="text-sm text-gray-300">{formData.type || 'No type specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Venue</p>
                <p className="text-sm text-gray-300">{formData.venue || 'No venue'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Performance Spots</p>
                <p className="text-sm text-gray-300">{eventSpots.length} spot(s) configured</p>
              </div>
            </div>

            {recurringSettings.isRecurring && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Recurring Event</p>
                  <p className="text-sm text-gray-300">
                    {recurringSettings.pattern} • {recurringSettings.count} occurrences
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/20 pt-4 mt-4">
            <p className="text-sm text-gray-300">
              Ready to publish? Your event will be visible to comedians and they can start applying.
            </p>
          </div>
        </CardContent>
      </Card>
    </MobileFormSection>
  );
};

export const CreateEventFormMobile: React.FC = () => {
  const formContext = useCreateEventForm();
  const { form, loadTemplate, onSubmit, onSaveDraft } = formContext;

  // Define wizard steps
  const wizardSteps: WizardStep[] = [
    {
      title: 'Event Details',
      component: BasicInfoStep,
      validate: () => {
        const title = form.getValues('title');
        if (!title || title.trim() === '') {
          return 'Event title is required';
        }
        return null;
      }
    },
    {
      title: 'Event Banner',
      component: BannerStep
    },
    {
      title: 'Venue & Location',
      component: VenueStep,
      validate: () => {
        const venue = form.getValues('venue');
        if (!venue || venue.trim() === '') {
          return 'Venue name is required';
        }
        return null;
      }
    },
    {
      title: 'Date & Time',
      component: SchedulingStep,
      validate: () => {
        const date = form.getValues('date');
        if (!date || date.trim() === '') {
          return 'Event date is required';
        }
        return null;
      }
    },
    {
      title: 'Performance Spots',
      component: SpotsStep
    },
    {
      title: 'Ticketing',
      component: TicketingStep
    },
    {
      title: 'Event Costs',
      component: CostsStep
    },
    {
      title: 'Requirements',
      component: RequirementsStep
    },
    {
      title: 'Review & Publish',
      component: SummaryStep
    }
  ];

  const handleComplete = async () => {
    await onSubmit(form.getValues());
  };

  const handleSaveDraft = async () => {
    await onSaveDraft(form.getValues());
  };

  return (
    <EventFormContext.Provider value={formContext}>
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <EventTemplateLoader onLoadTemplate={loadTemplate} />
        </div>

        <FormProvider {...form}>
          <MobileFormWizard
            steps={wizardSteps}
            onComplete={handleComplete}
            onSaveDraft={handleSaveDraft}
            draftKey="create-event"
            submitText="Publish Event"
            showSummary={true}
          />
        </FormProvider>
      </div>
    </EventFormContext.Provider>
  );
};

export default CreateEventFormMobile;
