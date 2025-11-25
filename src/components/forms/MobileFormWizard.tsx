/**
 * MobileFormWizard Component
 *
 * Multi-step form wizard optimized for mobile devices with:
 * - Progress indicator showing current step (e.g., 1/5, 2/5)
 * - Next/Previous navigation buttons (always visible)
 * - Auto-save draft between steps (localStorage + Supabase)
 * - Per-step validation before advancing
 * - Summary step before final submission
 * - Touch-friendly 44px buttons
 * - Full-screen mobile layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { useToast } from '@/hooks/use-toast';

export interface WizardStep {
  /** Step title shown in progress indicator */
  title: string;
  /** React component to render for this step */
  component: React.ComponentType<WizardStepProps>;
  /** Optional validation function - returns error message or null */
  validate?: (data: any) => string | null;
}

export interface WizardStepProps {
  /** Current form data across all steps */
  data: any;
  /** Update form data for current step */
  updateData: (stepData: any) => void;
  /** Navigate to next step */
  goNext: () => void;
  /** Navigate to previous step */
  goPrevious: () => void;
  /** Check if this is the first step */
  isFirstStep: boolean;
  /** Check if this is the last step */
  isLastStep: boolean;
}

interface MobileFormWizardProps {
  /** Array of wizard steps */
  steps: WizardStep[];
  /** Callback when form is completed and submitted */
  onComplete: (data: any) => Promise<void> | void;
  /** Callback to save draft (called on step navigation and periodically) */
  onSaveDraft?: (data: any) => Promise<void> | void;
  /** Unique key for localStorage draft persistence */
  draftKey: string;
  /** Initial form data */
  initialData?: any;
  /** Custom submit button text (default: "Submit") */
  submitText?: string;
  /** Show summary step before submission (default: true) */
  showSummary?: boolean;
}

export function MobileFormWizard({
  steps,
  onComplete,
  onSaveDraft,
  draftKey,
  initialData = {},
  submitText = 'Submit',
  showSummary = true
}: MobileFormWizardProps) {
  const { isMobile } = useMobileLayout();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`wizard-draft-${draftKey}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.data);
        setCurrentStep(parsed.step || 0);
        toast({
          title: 'Draft restored',
          description: 'Your previous progress has been loaded.',
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [draftKey, toast]);

  // Auto-save draft to localStorage
  const saveDraft = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`wizard-draft-${draftKey}`, JSON.stringify({
        data: formData,
        step: currentStep,
        timestamp: Date.now()
      }));

      // Save to Supabase if callback provided
      if (onSaveDraft) {
        await onSaveDraft(formData);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, currentStep, draftKey, onSaveDraft, isSaving]);

  // Update form data for current step
  const updateData = useCallback((stepData: any) => {
    setFormData((prev: any) => ({
      ...prev,
      ...stepData
    }));
  }, []);

  // Navigate to next step with validation
  const goNext = useCallback(async () => {
    const currentStepConfig = steps[currentStep];

    // Validate current step if validation function provided
    if (currentStepConfig?.validate) {
      const error = currentStepConfig.validate(formData);
      if (error) {
        toast({
          title: 'Validation Error',
          description: error,
          variant: 'destructive'
        });
        return;
      }
    }

    // Save draft before advancing
    await saveDraft();

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps, formData, saveDraft, toast]);

  // Navigate to previous step
  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);

      // Clear draft after successful submission
      localStorage.removeItem(`wizard-draft-${draftKey}`);

      toast({
        title: 'Success',
        description: 'Form submitted successfully!',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  // Get current step component
  const CurrentStepComponent = steps[currentStep]?.component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  if (!CurrentStepComponent) {
    return null;
  }

  return (
    <div className={cn(
      "w-full",
      isMobile && "min-h-screen flex flex-col"
    )}>
      {/* Progress Header */}
      <Card className={cn(
        "mb-4 border-b",
        isMobile && "rounded-none border-x-0 border-t-0"
      )}>
        <CardHeader className={cn(isMobile ? "p-4 pb-3" : "p-6")}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className={cn(
              "font-semibold",
              isMobile ? "text-base" : "text-lg"
            )}>
              {steps[currentStep]?.title}
            </CardTitle>
            <span className={cn(
              "font-medium text-muted-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <div className={cn(
        "flex-1",
        isMobile && "overflow-y-auto"
      )}>
        <CurrentStepComponent
          data={formData}
          updateData={updateData}
          goNext={goNext}
          goPrevious={goPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      </div>

      {/* Navigation Footer */}
      <Card className={cn(
        "mt-4 border-t",
        isMobile && "rounded-none border-x-0 border-b-0 sticky bottom-0 bg-background"
      )}>
        <CardFooter className={cn(
          "flex gap-3",
          isMobile ? "p-4 pt-3 flex-col" : "p-6"
        )}>
          {/* Mobile: Full-width stacked buttons */}
          {isMobile ? (
            <>
              {!isLastStep && (
                <Button
                  onClick={goNext}
                  className="w-full touch-target-44 bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || isSaving}
                >
                  <span>Next</span>
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}

              {isLastStep && (
                <Button
                  onClick={handleSubmit}
                  className="w-full touch-target-44 bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || isSaving}
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {submitText}
                    </>
                  )}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3 w-full">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={goPrevious}
                    className="touch-target-44"
                    disabled={isSubmitting || isSaving}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Back
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={saveDraft}
                  className={cn(
                    "touch-target-44",
                    isFirstStep && "col-span-2"
                  )}
                  disabled={isSaving || isSubmitting}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </>
          ) : (
            /* Desktop: Horizontal layout */
            <>
              <div className="flex gap-3 flex-1">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={goPrevious}
                    disabled={isSubmitting || isSaving}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isSaving || isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>

              {!isLastStep && (
                <Button
                  onClick={goNext}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || isSaving}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {isLastStep && (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting || isSaving}
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {submitText}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default MobileFormWizard;
