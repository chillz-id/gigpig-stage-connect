import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AutoSaveStatus, { AutoSaveIcon } from './AutoSaveStatus';
import { useDebounce } from '@/hooks/useDebounce';

interface FormData {
  title: string;
  description: string;
}

/**
 * Example implementation of AutoSaveStatus in a form
 * This demonstrates how to integrate auto-save functionality
 */
export const AutoSaveExample: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: ''
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  
  // Debounce form data to avoid excessive saves
  const debouncedFormData = useDebounce(formData, 1000);

  // Mock save function
  const saveData = useCallback(async (data: FormData) => {
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random errors for demo
          if (Math.random() > 0.8) {
            reject(new Error('Failed to save changes'));
          } else {
            resolve(true);
          }
        }, 1000);
      });
      
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error as Error);
    }
  }, []);

  // Auto-save when form data changes (after debounce)
  useEffect(() => {
    if (debouncedFormData.title || debouncedFormData.description) {
      saveData(debouncedFormData);
    }
  }, [debouncedFormData, saveData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Show idle state immediately when user starts typing
    if (saveStatus === 'saved' || saveStatus === 'error') {
      setSaveStatus('idle');
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Changes are automatically saved as you type
            </CardDescription>
          </div>
          {/* Full status indicator for desktop */}
          <div className="hidden sm:block">
            <AutoSaveStatus
              status={saveStatus}
              lastSaved={lastSaved}
              error={saveError}
            />
          </div>
          {/* Icon-only for mobile */}
          <div className="sm:hidden">
            <AutoSaveIcon
              status={saveStatus}
              lastSaved={lastSaved}
              error={saveError}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title</Label>
          <div className="relative">
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title..."
              className="pr-10"
            />
            {/* Inline icon indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <AutoSaveIcon
                status={saveStatus}
                lastSaved={lastSaved}
                error={saveError}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter event description..."
            rows={4}
          />
        </div>
        
        {/* Alternative: Fixed position indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <AutoSaveStatus
            status={saveStatus}
            lastSaved={lastSaved}
            error={saveError}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoSaveExample;