
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEventTemplates } from '@/hooks/useEventTemplates';

interface EventTemplateSaverProps {
  formData: any;
  eventSpots: any[];
  recurringSettings: any;
}

export const EventTemplateSaver: React.FC<EventTemplateSaverProps> = ({
  formData,
  eventSpots,
  recurringSettings
}) => {
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isTemplateSaved, setIsTemplateSaved] = useState(false);
  const { toast } = useToast();
  const { createTemplate, isCreating } = useEventTemplates();

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    // Convert Date objects to ISO strings for JSON serialization and exclude banner URL
    const templateData = {
      ...formData,
      bannerUrl: '', // Exclude banner URL for size reasons
      spots: eventSpots,
      recurringSettings: {
        ...recurringSettings,
        customDates: recurringSettings.customDates.map((customDate: any) => ({
          date: customDate.date instanceof Date ? customDate.date.toISOString() : customDate.date,
          times: customDate.times
        }))
      }
    };

    createTemplate({
      name: templateName,
      template_data: templateData
    });

    setTemplateName('');
    setShowSaveTemplate(false);
    setIsTemplateSaved(true);
    
    // Reset the "Template Saved" state after 3 seconds
    setTimeout(() => {
      setIsTemplateSaved(false);
    }, 3000);
  };

  return (
    <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
      <DialogTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          className="text-white border-white/30 hover:bg-white/10"
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
            Save your current event configuration as a reusable template. This will save all settings except the banner image.
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
          <div className="flex gap-2">
            <Button onClick={saveAsTemplate} disabled={isCreating}>
              {isCreating ? 'Saving...' : 'Save Template'}
            </Button>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
