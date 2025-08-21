
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, X, Loader2 } from 'lucide-react';
import { useEventTemplates } from '@/hooks/useEventTemplates';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { EventTemplatePreview } from './EventTemplatePreview';
import { EventTemplateErrorBoundary } from './EventTemplateErrorBoundary';
import { EventTemplateCategoryFilter, categorizeTemplate, TemplateCategory } from './EventTemplateCategoryFilter';

type EventTemplate = Tables<'event_templates'>;

interface EventTemplateLoaderProps {
  onLoadTemplate: (template: EventTemplate) => void;
}

interface TemplateItemProps {
  template: EventTemplate;
  onLoad: (template: EventTemplate) => void;
  onDelete: (templateId: string) => void;
  isDeleting: boolean;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ template, onLoad, onDelete, isDeleting }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTouchStart(Date.now());
    
    // Set timer for press-and-hold (800ms)
    const timer = setTimeout(() => {
      setShowDeleteDialog(true);
    }, 800);
    setTouchTimer(timer);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    
    const touchDuration = touchStart ? Date.now() - touchStart : 0;
    
    // If it was a short touch (< 300ms), load the template
    if (touchDuration < 300) {
      onLoad(template);
    }
    
    setTouchStart(null);
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      await onLoad(template);
      toast({
        title: "Template Loaded",
        description: `"${template.name}" has been loaded successfully.`,
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(template.id);
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex items-center justify-between p-2 hover:bg-white/10 rounded group">
      <div 
        className="flex-1 cursor-pointer flex items-center gap-2"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        <span className="text-sm">{template.name}</span>
      </div>
      
      {/* Preview Button */}
      <EventTemplatePreview 
        template={template} 
        onLoad={() => handleClick({ preventDefault: () => {}, stopPropagation: () => {} } as any)}
      />
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-500/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
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

export const EventTemplateLoader: React.FC<EventTemplateLoaderProps> = ({
  onLoadTemplate
}) => {
  const { templates, deleteTemplate, isDeleting, isLoading } = useEventTemplates();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  
  // Filter templates by category
  const filteredTemplates = templates.filter(template => {
    if (selectedCategory === 'all') return true;
    const category = categorizeTemplate(template.template_data);
    return category === selectedCategory;
  });
  
  // Calculate category counts
  const categoryCounts = templates.reduce((counts, template) => {
    const category = categorizeTemplate(template.template_data);
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {} as Record<TemplateCategory, number>);

  // Show loading skeleton while templates are loading
  if (isLoading) {
    return (
      <div className="w-48">
        <Skeleton className="h-10 w-full bg-white/20" />
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <EventTemplateErrorBoundary>
      <div className="flex gap-2">
        <EventTemplateCategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
        
        <Select>
          <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
            <FileText className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Load Template" />
          </SelectTrigger>
          <SelectContent>
            {filteredTemplates.length === 0 ? (
              <div className="p-2 text-sm text-gray-400">
                No templates in this category
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateItem
                  key={template.id}
                  template={template}
                  onLoad={onLoadTemplate}
                  onDelete={deleteTemplate}
                  isDeleting={isDeleting}
                />
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </EventTemplateErrorBoundary>
  );
};
