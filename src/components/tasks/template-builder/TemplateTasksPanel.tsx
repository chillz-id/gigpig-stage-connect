import { type UseFormReturn, type FieldArrayWithId } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { CreateTemplateFormData, TaskPriority, TaskCategory } from '@/types/task';

interface TemplateTasksPanelProps {
  form: UseFormReturn<CreateTemplateFormData>;
  fields: FieldArrayWithId<CreateTemplateFormData, 'template_items', 'id'>[];
  onAddTask: () => void;
  onRemoveTask: (index: number) => void;
  onDragEnd: (result: DropResult) => void;
  previewMode: boolean;
  getVariablePreview: (text: string) => string;
  priorityOptions: readonly TaskPriority[];
  categoryOptions: readonly TaskCategory[];
}

export function TemplateTasksPanel({
  form,
  fields,
  onAddTask,
  onRemoveTask,
  onDragEnd,
  previewMode,
  getVariablePreview,
  priorityOptions,
  categoryOptions
}: TemplateTasksPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Template Tasks</CardTitle>
        <Button onClick={onAddTask} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="p-4 border rounded-lg bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            {...dragProvided.dragHandleProps}
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
                                    {priorityOptions.map((priority) => (
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
                                    {categoryOptions.map((category) => (
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
                            onClick={() => onRemoveTask(index)}
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
  );
}
