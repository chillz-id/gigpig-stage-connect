
import React, { useState, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { GoogleMapsSetupCard } from './GoogleMapsSetupCard';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useCreateEventForm } from '@/hooks/useCreateEventForm';
import { BasicEventInfo } from './BasicEventInfo';
import { VenueSelection } from './VenueSelection';
import { EventScheduling } from './EventScheduling';
import { PerformerRequirements } from './PerformerRequirements';
import { TicketingInfo } from './TicketingInfo';
import { EventSpotManagerDraggable } from './EventSpotManagerDraggable';
import { EventBannerUpload } from './EventBannerUpload';
import { EventTemplateLoader } from './EventTemplateLoader';
import { EventTemplateSaver } from './EventTemplateSaver';
import { EventCostsSection } from './EventCostsSection';
import { DuplicateEventDialog } from './event-management/DuplicateEventDialog';

export const CreateEventForm: React.FC = () => {
  const { isLoaded, loadScript } = useGoogleMaps();
  const [showMapsSetup, setShowMapsSetup] = useState(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  const {
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
    // Duplicate detection
    showDuplicateDialog,
    duplicateCandidates,
    isCheckingDuplicates,
    isMergingData,
    pendingEventData,
    handleSelectSyncedEvent,
    handleCreateNewAnyway,
    handleDismissDuplicateDialog,
  } = useCreateEventForm();

  const { handleSubmit, control, formState: { errors } } = form;

  useEffect(() => {
    if (!hasTriedLoading) {
      setHasTriedLoading(true);
      loadScript().then(() => {
        // Check if it failed to load (no API key)
        setTimeout(() => {
          if (!isLoaded) {
            setShowMapsSetup(true);
          }
        }, 2000);
      });
    }
  }, [isLoaded, loadScript, hasTriedLoading]);

  // Derive isProcessing to disable form during any async operation
  const isProcessing = isCreating || isCheckingDuplicates || isMergingData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showMapsSetup && (
        <GoogleMapsSetupCard onDismiss={() => setShowMapsSetup(false)} />
      )}

      {/* Duplicate Detection Dialog */}
      {pendingEventData && (
        <DuplicateEventDialog
          open={showDuplicateDialog}
          onOpenChange={(open) => {
            if (!open) handleDismissDuplicateDialog();
          }}
          candidates={duplicateCandidates}
          newEventData={{
            title: pendingEventData.title,
            event_date: pendingEventData.date,
            venue: pendingEventData.venue,
          }}
          onSelectSyncedEvent={handleSelectSyncedEvent}
          onCreateNew={handleCreateNewAnyway}
          isLoading={isMergingData}
        />
      )}

      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-end">
            <EventTemplateLoader onLoadTemplate={loadTemplate} />
          </div>

          <EventBannerUpload 
            imageUrl={form.watch('imageUrl') || ''}
            onImageChange={(url) => form.setValue('imageUrl', url)}
          />

          <BasicEventInfo
            control={control}
            errors={errors}
          />

          <VenueSelection
            control={control}
            errors={errors}
            onAddressSelect={handleAddressSelect}
          />

          <EventScheduling
            control={control}
            errors={errors}
            recurringSettings={recurringSettings}
            onRecurringSettingsChange={setRecurringSettings}
          />

          <EventSpotManagerDraggable 
            spots={eventSpots} 
            onSpotsChange={setEventSpots}
          />

          <TicketingInfo
            control={control}
            errors={errors}
          />

          <EventCostsSection
            costs={eventCosts}
            onCostsChange={setEventCosts}
          />

          <PerformerRequirements
            control={control}
            errors={errors}
          />

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate('/dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <EventTemplateSaver
              formData={form.getValues()}
              eventSpots={eventSpots}
              recurringSettings={recurringSettings}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isProcessing}
              onClick={handleSubmit(onSaveDraft)}
              className="border-gray-300 hover:bg-gray-100"
            >
              {isCreating ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isCheckingDuplicates ? 'Checking...' :
               isCreating ? 'Publishing...' :
               recurringSettings.isRecurring ? 'Publish Recurring Events' : 'Publish Event'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
