// Task Template Builder - Component for creating and editing task templates
import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Save, Eye, Settings } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

import type {
  CreateTemplateFormData,
  CreateTemplateItemFormData,
  TemplateVariable,
  TemplateVariableType,
  TaskPriority,
  TaskCategory
} from '@/types/task';
import { useCreateTaskTemplate } from '@/hooks/useTasks';

// Validation schemas
const templateVariableSchema = z.object({
  type: z.enum(['text', 'number', 'date', 'select', 'user', 'boolean']),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default_value: z.any().optional(),
  options: z.array(z.string()).optional(),
});

const templateItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_hours: z.number().min(0).optional(),
  due_offset_days: z.number().optional(),
  category: z.enum(['event_planning', 'artist_management', 'marketing', 'travel', 'logistics', 'financial', 'administrative', 'creative']),
  order_index: z.number(),
  dependencies: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(['event_planning', 'artist_management', 'marketing', 'travel', 'logistics', 'financial', 'administrative', 'creative']),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  variables: z.record(templateVariableSchema).default({}),
  template_items: z.array(templateItemSchema).min(1, 'At least one task is required'),
});

interface TaskTemplateBuilderProps {
  initialTemplate?: Partial<CreateTemplateFormData>;
  onSave?: (template: CreateTemplateFormData) => void;
  onCancel?: () => void;
}

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const CATEGORY_OPTIONS: TaskCategory[] = [
  'event_planning',
  'artist_management', 
  'marketing',
  'travel',
  'logistics',
  'financial',
  'administrative',
  'creative'
];

const VARIABLE_TYPES: TemplateVariableType[] = ['text', 'number', 'date', 'select', 'user', 'boolean'];

export default function TaskTemplateBuilder({
  initialTemplate,
  onSave,
  onCancel
}: TaskTemplateBuilderProps) {
  const [activeTab, setActiveTab] = useState('template');
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const createTemplate = useCreateTaskTemplate();

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: initialTemplate?.name || '',
      description: initialTemplate?.description || '',
      category: initialTemplate?.category || 'administrative',
      is_public: initialTemplate?.is_public || false,
      tags: initialTemplate?.tags || [],
      variables: initialTemplate?.variables || {},
      template_items: initialTemplate?.template_items || [
        {
          title: '',
          description: '',
          priority: 'medium',
          category: 'administrative',
          order_index: 0,
          dependencies: [],
          metadata: {}
        }
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'template_items',
  });

  // Variable management
  const [variableForm, setVariableForm] = useState<{
    key: string;
    variable: TemplateVariable;
  }>({
    key: '',
    variable: {
      type: 'text',
      label: '',
      description: '',
      required: false,
    }
  });

  const handleVariableSave = useCallback(() => {
    if (!variableForm.key || !variableForm.variable.label) {
      toast({
        title: "Validation Error",
        description: "Variable key and label are required",
        variant: "destructive",
      });
      return;
    }

    const currentVariables = form.getValues('variables');
    form.setValue('variables', {
      ...currentVariables,
      [variableForm.key]: variableForm.variable
    });

    setVariableDialogOpen(false);
    setEditingVariable(null);
    setVariableForm({
      key: '',
      variable: {
        type: 'text',
        label: '',
        description: '',
        required: false,
      }
    });
  }, [variableForm, form]);

  const handleVariableEdit = useCallback((key: string) => {
    const variables = form.getValues('variables');
    const variable = variables[key];
    if (variable) {
      setVariableForm({ key, variable });
      setEditingVariable(key);
      setVariableDialogOpen(true);
    }
  }, [form]);

  const handleVariableDelete = useCallback((key: string) => {
    const currentVariables = form.getValues('variables');
    const { [key]: deleted, ...rest } = currentVariables;
    form.setValue('variables', rest);
  }, [form]);

  // Tag management
  const handleAddTag = useCallback(() => {
    if (newTag.trim()) {
      const currentTags = form.getValues('tags');
      if (!currentTags.includes(newTag.trim())) {
        form.setValue('tags', [...currentTags, newTag.trim()]);
      }
      setNewTag('');
    }
  }, [newTag, form]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [form]);

  // Task item management
  const handleAddTaskItem = useCallback(() => {
    const currentItems = form.getValues('template_items');
    append({
      title: '',
      description: '',
      priority: 'medium',
      category: 'administrative',
      order_index: currentItems.length,
      dependencies: [],
      metadata: {}
    });
  }, [append, form]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex !== destinationIndex) {
      move(sourceIndex, destinationIndex);
      
      // Update order indices
      const items = form.getValues('template_items');
      items.forEach((item, index) => {
        form.setValue(`template_items.${index}.order_index`, index);
      });
    }
  }, [move, form]);

  // Form submission
  const handleSubmit = useCallback((data: CreateTemplateFormData) => {
    if (onSave) {
      onSave(data);
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => {
          toast({
            title: "Template Created",
            description: `"${data.name}" template has been created successfully.`,
          });
        }
      });
    }
  }, [onSave, createTemplate]);

  // Variable substitution preview
  const getVariablePreview = useCallback((text: string) => {
    if (!previewMode) return text;
    
    const variables = form.getValues('variables');
    let preview = text;
    
    Object.entries(variables).forEach(([key, variable]) => {
      const placeholder = `{${key}}`;
      const replacement = `[${variable.label}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), replacement);
    });
    
    return preview;
  }, [previewMode, form]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {initialTemplate ? 'Edit Template' : 'Create Task Template'}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={createTemplate.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {createTemplate.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="template">Template Info</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        {/* Template Information */}
        <TabsContent value="template" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g., New Tour Setup"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.watch('category')}
                    onValueChange={(value) => form.setValue('category', value as TaskCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Describe what this template is used for..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={form.watch('is_public')}
                  onCheckedChange={(checked) => form.setValue('is_public', checked)}
                />
                <Label htmlFor="is_public">Make this template public</Label>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('tags').map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Template Variables</CardTitle>
              <Dialog open={variableDialogOpen} onOpenChange={setVariableDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Variable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingVariable ? 'Edit Variable' : 'Add Variable'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Variable Key</Label>
                      <Input
                        value={variableForm.key}
                        onChange={(e) => setVariableForm(prev => ({ ...prev, key: e.target.value }))}
                        placeholder="e.g., venue_name, event_date"
                        disabled={!!editingVariable}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={variableForm.variable.type}
                        onValueChange={(value) => setVariableForm(prev => ({
                          ...prev,
                          variable: { ...prev.variable, type: value as TemplateVariableType }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={variableForm.variable.label}
                        onChange={(e) => setVariableForm(prev => ({
                          ...prev,
                          variable: { ...prev.variable, label: e.target.value }
                        }))}
                        placeholder="Display name for this variable"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={variableForm.variable.description || ''}
                        onChange={(e) => setVariableForm(prev => ({
                          ...prev,
                          variable: { ...prev.variable, description: e.target.value }
                        }))}
                        placeholder="Optional description..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={variableForm.variable.required || false}
                        onCheckedChange={(checked) => setVariableForm(prev => ({
                          ...prev,
                          variable: { ...prev.variable, required: checked }
                        }))}
                      />
                      <Label>Required</Label>
                    </div>

                    {variableForm.variable.type === 'select' && (
                      <div className="space-y-2">
                        <Label>Options (one per line)</Label>
                        <Textarea
                          value={(variableForm.variable.options || []).join('\n')}
                          onChange={(e) => setVariableForm(prev => ({
                            ...prev,
                            variable: {
                              ...prev.variable,
                              options: e.target.value.split('\n').filter(Boolean)
                            }
                          }))}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          rows={4}
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setVariableDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleVariableSave}>
                        {editingVariable ? 'Update' : 'Add'} Variable
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {Object.keys(form.watch('variables')).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No variables defined. Variables allow you to create reusable templates with placeholders.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(form.watch('variables')).map(([key, variable]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{`{${key}}`}</div>
                        <div className="text-sm text-gray-600">{variable.label}</div>
                        {variable.description && (
                          <div className="text-xs text-gray-500">{variable.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{variable.type}</Badge>
                        {variable.required && <Badge variant="default">Required</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVariableEdit(key)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVariableDelete(key)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Template Tasks</CardTitle>
              <Button onClick={handleAddTaskItem} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tasks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="p-4 border rounded-lg bg-white"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-2 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Task Title</Label>
                                      <Input
                                        {...form.register(`template_items.${index}.title`)}
                                        placeholder="e.g., Confirm {venue_name} booking"
                                      />
                                      {previewMode && (
                                        <p className="text-xs text-blue-600">
                                          Preview: {getVariablePreview(form.watch(`template_items.${index}.title`) || '')}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Priority</Label>
                                      <Select
                                        value={form.watch(`template_items.${index}.priority`)}
                                        onValueChange={(value) => form.setValue(`template_items.${index}.priority`, value as TaskPriority)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {PRIORITY_OPTIONS.map(priority => (
                                            <SelectItem key={priority} value={priority}>
                                              {priority.toUpperCase()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Category</Label>
                                      <Select
                                        value={form.watch(`template_items.${index}.category`)}
                                        onValueChange={(value) => form.setValue(`template_items.${index}.category`, value as TaskCategory)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CATEGORY_OPTIONS.map(category => (
                                            <SelectItem key={category} value={category}>
                                              {category.replace('_', ' ').toUpperCase()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Due Offset (days)</Label>
                                      <Input
                                        type="number"
                                        {...form.register(`template_items.${index}.due_offset_days`, {
                                          valueAsNumber: true
                                        })}
                                        placeholder="Days from start date"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      {...form.register(`template_items.${index}.description`)}
                                      placeholder="Task description..."
                                      rows={2}
                                    />
                                    {previewMode && form.watch(`template_items.${index}.description`) && (
                                      <p className="text-xs text-blue-600">
                                        Preview: {getVariablePreview(form.watch(`template_items.${index}.description`) || '')}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {fields.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No tasks defined. Add at least one task to create the template.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}