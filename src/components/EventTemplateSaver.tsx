
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEventTemplates } from '@/hooks/useEventTemplates';
import { EventFormData, RecurringSettings, EventSpot } from '@/types/eventTypes';

interface EventTemplateSaverProps {
  formData: EventFormData;
  eventSpots: EventSpot[];
  recurringSettings: RecurringSettings;
}

export const EventTemplateSaver: React.FC<EventTemplateSaverProps> = ({
  formData,
  eventSpots,
  recurringSettings
}) => {
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isTemplateSaved, setIsTemplateSaved] = useState(false);
  const [includeBanner, setIncludeBanner] = useState(false);
  const { toast } = useToast();
  const { createTemplate, isCreating } = useEventTemplates();

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert Date objects to ISO strings for JSON serialization
      const templateData = {
        ...formData,
        imageUrl: includeBanner ? formData.imageUrl : '', // Conditionally include banner URL
        bannerUrl: includeBanner ? formData.imageUrl : '', // Support both field names
        spots: eventSpots,
        recurringSettings: {
          ...recurringSettings,
          customDates: recurringSettings.customDates?.map((customDate: any) => ({
            date: customDate.date instanceof Date ? customDate.date.toISOString() : customDate.date,
            times: customDate.times || []
          })) || []
        }
      };

      await createTemplate({
        name: templateName.trim(),
        template_data: templateData
      });

      setTemplateName('');
      setIncludeBanner(false);
      setShowSaveTemplate(false);
      setIsTemplateSaved(true);
      
      // Reset the "Template Saved" state after 3 seconds
      setTimeout(() => {
        setIsTemplateSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
      <DialogTrigger asChild>
        <Button 
          type="button"
          className="professional-button text-white border-white/30 hover:bg-white/10"
          disabled={isTemplateSaved}
        >
          {isTemplateSaved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Template Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current event configuration as a reusable template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Weekly Comedy Night Template"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeBanner"
              checked={includeBanner}
              onCheckedChange={setIncludeBanner}
              className="border-gray-400"
            />
            <Label 
              htmlFor="includeBanner" 
              className="text-sm text-gray-300 cursor-pointer"
            >
              Include event banner in template
            </Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveAsTemplate} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating ? 'Saving...' : 'Save Template'}
            </Button>
            <Button className="professional-button" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
