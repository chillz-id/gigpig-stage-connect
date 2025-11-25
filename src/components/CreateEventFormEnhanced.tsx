import React, { useState, useEffect, useCallback } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { GoogleMapsSetupCard } from './GoogleMapsSetupCard';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useCreateEventForm } from '@/hooks/useCreateEventForm';
import { useEventValidation } from '@/hooks/useEventValidation';
import { BasicEventInfoEnhanced } from './events/BasicEventInfoEnhanced';
import { VenueSelection } from './VenueSelection';
import { EventScheduling } from './EventScheduling';
import { PerformerRequirements } from './PerformerRequirements';
import { TicketingInfo } from './TicketingInfo';
import { EventSpotManagerDraggable } from './EventSpotManagerDraggable';
import { EventBannerUpload } from './EventBannerUpload';
import { EventTemplateLoader } from './EventTemplateLoader';
import { EventTemplateSaver } from './EventTemplateSaver';
import { EventCostsSection } from './EventCostsSection';
import { EventPreview } from './events/EventPreview';
import { UnsavedChangesWarning } from './events/UnsavedChangesWarning';
import { ValidationSummary } from './events/ValidationFeedback';
import { Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveStatus } from '@/components/events/AutoSaveStatus';
import { RecurringSettings } from '@/types/eventTypes';

export const CreateEventFormEnhanced: React.FC = () => {
  const { isLoaded, loadScript } = useGoogleMaps();
  const [showMapsSetup, setShowMapsSetup] = useState(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

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
    currentEventId,
    autoSaveEnabled,
  } = useCreateEventForm();

  const { handleSubmit, control, formState: { errors }, watch } = form;
  const formData = watch();

  // Initialize validation
  const validation = useEventValidation(
    formData,
    eventSpots,
    recurringSettings,
    {
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 500
    }
  );

  // Initialize auto-save when we have a draft event ID
  const autoSave = useAutoSave({
    eventId: currentEventId,
    formData,
    eventSpots,
    recurringSettings,
    enabled: autoSaveEnabled,
    onSaveSuccess: () => {
      console.log('Auto-save successful');
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your changes could not be saved automatically. Please save manually.",
        variant: "destructive",
      });
    }
  });

  // Calculate completion percentage
  const calculateCompletion = () => {
    const requiredFields = ['title', 'venue', 'address', 'date', 'time'];
    const completedRequired = requiredFields.filter(field => formData[field]).length;
    const totalFields = Object.keys(formData).filter(key => formData[key]).length;
    
    // Base completion from required fields (60%)
    const requiredCompletion = (completedRequired / requiredFields.length) * 60;
    
    // Additional completion from optional fields (40%)
    const optionalCompletion = Math.min((totalFields / 15) * 40, 40);
    
    return Math.round(requiredCompletion + optionalCompletion);
  };

  const completionPercentage = calculateCompletion();

  useEffect(() => {
    if (!hasTriedLoading) {
      setHasTriedLoading(true);
      loadScript().then(() => {
        setTimeout(() => {
          if (!isLoaded) {
            setShowMapsSetup(true);
          }
        }, 2000);
      });
    }
  }, [isLoaded, loadScript, hasTriedLoading]);

  // Handle save draft with validation
  const handleSaveDraftWithValidation = async (data: any) => {
    // Allow saving draft even with validation errors
    await onSaveDraft(data);
    validation.resetValidation();
  };

  // Handle publish with validation
  const handlePublishWithValidation = async (data: any) => {
    // Validate all fields first
    const result = validation.validateAllFields();
    
    if (!result.isValid) {
      toast({
        title: "Validation Failed",
        description: `Please fix ${validation.errorCount} error(s) before publishing.`,
        variant: "destructive",
      });
      return;
    }

    // Show preview if validation passes
    setShowPreview(true);
  };

  // Handle final publish from preview
  const handleFinalPublish = async () => {
    setShowPreview(false);
    await onSubmit(formData);
    validation.resetValidation();
    
    // Clear localStorage after successful publish
    if (typeof window !== 'undefined') {
      localStorage.removeItem('event_draft');
    }
  };

  // Stable callback for recurring settings to prevent Select from closing
  const handleRecurringSettingsChange = useCallback((updates: Partial<RecurringSettings>) => {
    setRecurringSettings(prev => ({ ...prev, ...updates }));
  }, [setRecurringSettings]);

  // Scroll to field with error
  const scrollToField = (fieldName: string) => {
    const element = document.getElementById(fieldName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Unsaved Changes Warning */}
      <UnsavedChangesWarning
        hasUnsavedChanges={validation.isDirty}
        onSave={() => handleSaveDraftWithValidation(formData)}
        message="You have unsaved changes to your event. Would you like to save them before leaving?"
      />

      {/* Progress Bar */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Event Creation Progress</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{completionPercentage}% Complete</span>
            {autoSaveEnabled && currentEventId && (
              <AutoSaveStatus
                status={autoSave.status}
                lastSaved={autoSave.lastSaved}
                error={autoSave.error}
              />
            )}
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            {validation.hasErrors && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validation.errorCount} Error{validation.errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {validation.hasWarnings && (
              <Badge variant="warning" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validation.warningCount} Warning{validation.warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {validation.isValid && completionPercentage === 100 && (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready to Publish
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary (Sticky) */}
      {(validation.hasErrors || validation.hasWarnings) && (
        <div className="sticky top-20 z-30">
          <ValidationSummary
            errors={validation.validationResult.errors}
            warnings={validation.validationResult.warnings}
            onFixError={scrollToField}
          />
        </div>
      )}

      {showMapsSetup && (
        <GoogleMapsSetupCard onDismiss={() => setShowMapsSetup(false)} />
      )}
      
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(handlePublishWithValidation)} className="space-y-6">
          <div className="flex justify-end">
            <EventTemplateLoader onLoadTemplate={loadTemplate} />
          </div>

          <EventBannerUpload
            bannerUrl={form.watch('imageUrl') || ''}
            bannerPosition={form.watch('bannerPosition')}
            onBannerChange={(data) => {
              form.setValue('imageUrl', data.url);
              form.setValue('bannerPosition', data.position);
            }}
          />

          <BasicEventInfoEnhanced
            control={control}
            errors={errors}
            validation={validation}
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
            onRecurringSettingsChange={handleRecurringSettingsChange}
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
              className="professional-button"
              disabled={isCreating}
              onClick={handleSubmit(handleSaveDraftWithValidation)}
              className="border-gray-300 hover:bg-gray-100"
            >
              {isCreating ? 'Saving...' : 'Save as Draft'}
            </Button>
            
            <Button
              type="button"
              className="professional-button"
              onClick={() => setShowPreview(true)}
              className="border-blue-300 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              type="submit"
              disabled={isCreating || !validation.isValid}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? 'Publishing...' : 
               recurringSettings.isRecurring ? 'Publish Recurring Events' : 'Publish Event'}
            </Button>
          </div>
        </form>
      </FormProvider>

      {/* Event Preview Modal */}
      <EventPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        eventSpots={eventSpots}
        recurringSettings={recurringSettings}
        validationResult={validation.validationResult}
        onPublish={handleFinalPublish}
        isPublishing={isCreating}
      />
    </div>
  );
};