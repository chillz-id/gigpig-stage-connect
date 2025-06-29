
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEventTemplates } from '@/hooks/useEventTemplates';

interface EventTemplateManagerProps {
  formData: any;
  eventSpots: any[];
  recurringSettings: any;
  onLoadTemplate: (template: any) => void;
}

export const EventTemplateManager: React.FC<EventTemplateManagerProps> = ({
  formData,
  eventSpots,
  recurringSettings,
  onLoadTemplate
}) => {
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const { toast } = useToast();
  const { templates, createTemplate, isCreating } = useEventTemplates();

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    // Convert Date objects to ISO strings for JSON serialization
    const templateData = {
      ...formData,
      spots: eventSpots,
      recurringSettings: {
        ...recurringSettings,
        customDates: recurringSettings.customDates.map((date: Date) => date.toISOString())
      }
    };

    createTemplate({
      name: templateName,
      template_data: templateData
    });

    setTemplateName('');
    setShowSaveTemplate(false);
  };

  return (
    <div className="flex gap-2">
      {templates.length > 0 && (
        <Select onValueChange={(value) => {
          const template = templates.find(t => t.id === value);
          if (template) onLoadTemplate(template);
        }}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
            <FileText className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Load Template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
            <Save className="w-4 h-4 mr-2" />
            Save Template
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
            <div className="flex gap-2">
              <Button onClick={saveAsTemplate} disabled={isCreating}>
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
