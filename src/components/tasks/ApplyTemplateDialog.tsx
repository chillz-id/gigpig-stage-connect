// Apply Template Dialog - Component for applying task templates with variable substitution
import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, FileText, Play, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

import type {
  TaskTemplate,
  ApplyTemplateData,
  TemplateVariable,
  Task
} from '@/types/task';
import { useTaskTemplate, useApplyTemplate } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  onSuccess?: (createdTasks: Task[]) => void;
  defaultValues?: {
    assignee_id?: string;
    start_date?: string;
    project_id?: string;
  };
}

// Dynamic schema based on template variables
const createValidationSchema = (variables: Record<string, TemplateVariable>) => {
  const variableSchemas: Record<string, z.ZodTypeAny> = {};
  
  Object.entries(variables).forEach(([key, variable]) => {
    let schema: z.ZodTypeAny;
    
    switch (variable.type) {
      case 'text':
        schema = z.string();
        break;
      case 'number':
        schema = z.number();
        break;
      case 'date':
        schema = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        });
        break;
      case 'select':
        schema = z.string();
        break;
      case 'user':
        schema = z.string().uuid();
        break;
      case 'boolean':
        schema = z.boolean();
        break;
      default:
        schema = z.string();
    }
    
    if (variable.required) {
      if (variable.type === 'number') {
        schema = schema.refine((val) => val !== undefined && val !== null, {
          message: `${variable.label} is required`
        });
      } else if (variable.type === 'boolean') {
        // Boolean is always valid
      } else {
        schema = schema.min(1, `${variable.label} is required`);
      }
    } else {
      schema = schema.optional();
    }
    
    variableSchemas[key] = schema;
  });

  return z.object({
    start_date: z.string().optional(),
    assignee_id: z.string().uuid().optional(),
    project_id: z.string().optional(),
    variables: z.object(variableSchemas),
  });
};

export default function ApplyTemplateDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
  defaultValues
}: ApplyTemplateDialogProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'variables' | 'preview' | 'applying'>('variables');
  const [previewTasks, setPreviewTasks] = useState<any[]>([]);

  const { data: template, isLoading: templateLoading } = useTaskTemplate(templateId || '');
  const applyTemplate = useApplyTemplate();

  // Create form with dynamic validation
  const validationSchema = template ? createValidationSchema(template.variables) : z.object({
    start_date: z.string().optional(),
    assignee_id: z.string().uuid().optional(),
    project_id: z.string().optional(),
    variables: z.object({}),
  });

  const form = useForm<{
    start_date?: string;
    assignee_id?: string;
    project_id?: string;
    variables: Record<string, any>;
  }>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      start_date: defaultValues?.start_date || new Date().toISOString().split('T')[0],
      assignee_id: defaultValues?.assignee_id || user?.id,
      project_id: defaultValues?.project_id,
      variables: {},
    },
  });

  // Initialize default values for variables
  useEffect(() => {
    if (template?.variables) {
      const defaultVariables: Record<string, any> = {};
      Object.entries(template.variables).forEach(([key, variable]) => {
        if (variable.default_value !== undefined) {
          defaultVariables[key] = variable.default_value;
        }
      });
      form.setValue('variables', defaultVariables);
    }
  }, [template?.variables, form]);

  // Generate preview tasks
  const generatePreview = useCallback(() => {
    if (!template?.template_items) return;

    const formData = form.getValues();
    const startDate = formData.start_date ? new Date(formData.start_date) : new Date();

    const preview = template.template_items.map((item, index) => {
      // Substitute variables in title and description
      let title = item.title;
      let description = item.description || '';

      Object.entries(formData.variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        description = description.replace(new RegExp(placeholder, 'g'), String(value));
      });

      // Calculate due date
      let dueDate: Date | undefined;
      if (item.due_offset_days !== undefined) {
        dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + item.due_offset_days);
      }

      return {
        id: `preview-${index}`,
        title,
        description,
        priority: item.priority,
        category: item.category,
        estimated_hours: item.estimated_hours,
        due_date: dueDate?.toISOString(),
        order_index: item.order_index,
      };
    });

    setPreviewTasks(preview.sort((a, b) => a.order_index - b.order_index));
  }, [template, form]);

  // Handle form submission
  const handleApply = useCallback(async () => {
    if (!template) return;

    setCurrentStep('applying');
    
    const formData = form.getValues();
    const applyData: ApplyTemplateData = {
      template_id: template.id,
      variables: formData.variables,
      start_date: formData.start_date,
      assignee_id: formData.assignee_id,
      project_id: formData.project_id,
    };

    try {
      const createdTasks = await applyTemplate.mutateAsync(applyData);
      
      toast({
        title: "Template Applied",
        description: `${createdTasks.length} tasks have been created from "${template.name}".`,
      });

      onSuccess?.(createdTasks);
      onOpenChange(false);
      setCurrentStep('variables');
    } catch (error) {
      setCurrentStep('preview');
      toast({
        title: "Error Applying Template",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [template, form, applyTemplate, onSuccess, onOpenChange]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStep === 'variables') {
      const isValid = form.trigger();
      if (isValid) {
        generatePreview();
        setCurrentStep('preview');
      }
    } else if (currentStep === 'preview') {
      handleApply();
    }
  }, [currentStep, form, generatePreview, handleApply]);

  // Handle back step
  const handleBack = useCallback(() => {
    if (currentStep === 'preview') {
      setCurrentStep('variables');
    }
  }, [currentStep]);

  // Reset dialog state when closed
  useEffect(() => {
    if (!open) {
      setCurrentStep('variables');
      setPreviewTasks([]);
      form.reset();
    }
  }, [open, form]);

  if (templateLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!template) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Not Found</DialogTitle>
            <DialogDescription>
              The requested template could not be found.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Apply Template: {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {/* Variables Step */}
          {currentStep === 'variables' && (
            <div className="space-y-6 p-1">
              {/* Template Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        {...form.register('start_date')}
                      />
                      <p className="text-xs text-gray-500">
                        Due dates will be calculated from this date
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignee_id">Default Assignee</Label>
                      <Select
                        value={form.watch('assignee_id')}
                        onValueChange={(value) => form.setValue('assignee_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={user?.id || ''}>
                            {user?.name || user?.email || 'Me'}
                          </SelectItem>
                          {/* Add more users here if needed */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Variables */}
              {Object.keys(template.variables).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Template Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(template.variables).map(([key, variable]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`var-${key}`} className="flex items-center gap-2">
                          {variable.label}
                          {variable.required && <span className="text-red-500">*</span>}
                          <Badge variant="outline" className="text-xs">
                            {variable.type}
                          </Badge>
                        </Label>

                        {variable.type === 'text' && (
                          <Input
                            id={`var-${key}`}
                            {...form.register(`variables.${key}`)}
                            placeholder={variable.description}
                          />
                        )}

                        {variable.type === 'number' && (
                          <Input
                            id={`var-${key}`}
                            type="number"
                            {...form.register(`variables.${key}`, { valueAsNumber: true })}
                            placeholder={variable.description}
                          />
                        )}

                        {variable.type === 'date' && (
                          <Input
                            id={`var-${key}`}
                            type="date"
                            {...form.register(`variables.${key}`)}
                          />
                        )}

                        {variable.type === 'select' && variable.options && (
                          <Select
                            value={form.watch(`variables.${key}`)}
                            onValueChange={(value) => form.setValue(`variables.${key}`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option..." />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {variable.type === 'user' && (
                          <Select
                            value={form.watch(`variables.${key}`)}
                            onValueChange={(value) => form.setValue(`variables.${key}`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={user?.id || ''}>
                                {user?.name || user?.email || 'Me'}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {variable.description && (
                          <p className="text-xs text-gray-500">{variable.description}</p>
                        )}

                        {form.formState.errors.variables?.[key] && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.variables[key]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-6 p-1">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Review the tasks that will be created. Click "Apply Template" to proceed.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Tasks to be Created ({previewTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewTasks.map((task, index) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  task.priority === 'urgent' ? 'destructive' :
                                  task.priority === 'high' ? 'default' :
                                  task.priority === 'medium' ? 'secondary' : 'outline'
                                }
                              >
                                {task.priority}
                              </Badge>
                              <Badge variant="outline">
                                {task.category.replace('_', ' ')}
                              </Badge>
                              {task.due_date && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            Task {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Applying Step */}
          {currentStep === 'applying' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Applying Template...</p>
              <p className="text-sm text-gray-600">Creating {previewTasks.length} tasks</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {currentStep === 'variables' && Object.keys(template.variables).length > 0 && (
              <Badge variant="outline">
                Step 1 of 2: Configure Variables
              </Badge>
            )}
            {currentStep === 'preview' && (
              <Badge variant="outline">
                Step 2 of 2: Review Tasks
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 'preview' && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            {currentStep !== 'applying' && (
              <Button onClick={handleNext} disabled={applyTemplate.isPending}>
                <Play className="w-4 h-4 mr-2" />
                {currentStep === 'variables' ? 'Preview Tasks' : 'Apply Template'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}