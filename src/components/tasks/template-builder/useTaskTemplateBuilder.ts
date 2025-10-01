import { useCallback, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { toast } from '@/hooks/use-toast';
import { useCreateTaskTemplate } from '@/hooks/useTasks';
import type { CreateTemplateFormData, TemplateVariable } from '@/types/task';

import {
  buildTemplateDefaultValues,
  templateSchema,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
  VARIABLE_TYPES,
  getDefaultVariable
} from './schema';

interface UseTaskTemplateBuilderParams {
  initialTemplate?: Partial<CreateTemplateFormData>;
  onSave?: (template: CreateTemplateFormData) => void;
}

export function useTaskTemplateBuilder({
  initialTemplate,
  onSave
}: UseTaskTemplateBuilderParams) {
  const [activeTab, setActiveTab] = useState<'template' | 'variables' | 'tasks'>('template');
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const [variableForm, setVariableForm] = useState<{
    key: string;
    variable: TemplateVariable;
  }>({
    key: '',
    variable: getDefaultVariable()
  });

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: useMemo(() => buildTemplateDefaultValues(initialTemplate), [initialTemplate])
  });

  const { control, handleSubmit, getValues, setValue } = form;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'template_items'
  });

  const createTemplate = useCreateTaskTemplate();

  const resetVariableForm = useCallback(() => {
    setVariableForm({
      key: '',
      variable: getDefaultVariable()
    });
    setEditingVariable(null);
  }, []);

  const handleVariableSave = useCallback(() => {
    if (!variableForm.key || !variableForm.variable.label) {
      toast({
        title: 'Validation Error',
        description: 'Variable key and label are required',
        variant: 'destructive'
      });
      return;
    }

    const currentVariables = getValues('variables');
    setValue('variables', {
      ...currentVariables,
      [variableForm.key]: variableForm.variable
    });

    setVariableDialogOpen(false);
    resetVariableForm();
  }, [variableForm, getValues, setValue, resetVariableForm]);

  const handleVariableEdit = useCallback((key: string) => {
    const variables = getValues('variables');
    const variable = variables[key];
    if (variable) {
      setVariableForm({ key, variable });
      setEditingVariable(key);
      setVariableDialogOpen(true);
    }
  }, [getValues]);

  const handleVariableDelete = useCallback((key: string) => {
    const currentVariables = getValues('variables');
    const { [key]: _deleted, ...rest } = currentVariables;
    setValue('variables', rest);
  }, [getValues, setValue]);

  const handleVariableDialogChange = useCallback((open: boolean) => {
    setVariableDialogOpen(open);
    if (!open) {
      resetVariableForm();
    }
  }, [resetVariableForm]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim()) {
      const currentTags = getValues('tags');
      if (!currentTags.includes(newTag.trim())) {
        setValue('tags', [...currentTags, newTag.trim()]);
      }
      setNewTag('');
    }
  }, [newTag, getValues, setValue]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const currentTags = getValues('tags');
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [getValues, setValue]);

  const handleAddTaskItem = useCallback(() => {
    const currentItems = getValues('template_items');
    append({
      title: '',
      description: '',
      priority: 'medium',
      category: 'administrative',
      order_index: currentItems.length,
      dependencies: [],
      metadata: {}
    });
  }, [append, getValues]);

  const handleTaskDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex !== destinationIndex) {
      move(sourceIndex, destinationIndex);

      const items = getValues('template_items');
      items.forEach((_, index) => {
        setValue(`template_items.${index}.order_index`, index, { shouldDirty: true });
      });
    }
  }, [move, getValues, setValue]);

  const togglePreviewMode = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  const getVariablePreview = useCallback((text: string) => {
    if (!previewMode) return text;

    const variables = getValues('variables');
    let preview = text;

    Object.entries(variables).forEach(([key, variable]) => {
      const placeholder = `{${key}}`;
      const replacement = `[${variable.label}]`;
      preview = preview.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return preview;
  }, [previewMode, getValues]);

  const submitTemplate = useMemo(() => handleSubmit((data) => {
    if (onSave) {
      onSave(data);
      return;
    }

    createTemplate.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Template Created',
          description: `"${data.name}" template has been created successfully.`
        });
      }
    });
  }), [handleSubmit, onSave, createTemplate]);

  return {
    form,
    fields,
    removeTaskItem: remove,
    activeTab,
    setActiveTab,
    previewMode,
    togglePreviewMode,
    variableDialogOpen,
    handleVariableDialogChange,
    variableForm,
    setVariableForm,
    handleVariableSave,
    handleVariableEdit,
    handleVariableDelete,
    editingVariable,
    newTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    handleAddTaskItem,
    handleTaskDragEnd,
    submitTemplate,
    isSaving: createTemplate.isPending,
    getVariablePreview,
    priorityOptions: PRIORITY_OPTIONS,
    categoryOptions: CATEGORY_OPTIONS,
    variableTypes: VARIABLE_TYPES
  };
}
