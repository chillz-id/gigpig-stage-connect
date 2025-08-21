
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, FileText, X, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEventTemplates } from '@/hooks/useEventTemplates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EventFormData, RecurringSettings, EventSpot } from '@/types/eventTypes';
import { Tables } from '@/integrations/supabase/types';

type EventTemplate = Tables<'event_templates'>;

interface EventTemplateManagerProps {
  formData: EventFormData;
  eventSpots: EventSpot[];
  recurringSettings: RecurringSettings;
  onLoadTemplate: (template: EventTemplate) => void;
}

export const EventTemplateManager: React.FC<EventTemplateManagerProps> = ({
  formData,
  eventSpots,
  recurringSettings,
  onLoadTemplate
}) => {
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { templates, createTemplate, deleteTemplate, isCreating, isDeleting, isLoading } = useEventTemplates();

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

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      setTemplateToDelete(null);
      setShowDeleteConfirm(false);
      setSelectedTemplate(null);
    }
  };

  const handleMouseDown = (templateId: string) => {
    longPressTimer.current = setTimeout(() => {
      handleDeleteTemplate(templateId);
    }, 800); // 800ms press-and-hold
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (templateId: string) => {
    longPressTimer.current = setTimeout(() => {
      handleDeleteTemplate(templateId);
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Show loading skeleton while templates are loading
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-10 w-48 bg-white/20" />
        <Skeleton className="h-10 w-32 bg-white/20" />
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {templates.length > 0 && (
        <Select 
          value={selectedTemplate || ''} 
          onValueChange={(value) => {
            setSelectedTemplate(value);
            const template = templates.find(t => t.id === value);
            if (template) onLoadTemplate(template);
          }}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
            <FileText className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Load Template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem 
                key={template.id} 
                value={template.id}
                className="group relative"
                onMouseDown={() => handleMouseDown(template.id)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleTouchStart(template.id)}
                onTouchEnd={handleTouchEnd}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex-1">{template.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-red-500/20 rounded"
                    title="Delete template"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
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
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isCreating ? 'Saving...' : 'Save Template'}
              </Button>
              <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-600 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Template
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTemplate}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
