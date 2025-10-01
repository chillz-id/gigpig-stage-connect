import { z } from 'zod';
import type {
  CreateTemplateFormData,
  TemplateVariable,
  TaskPriority,
  TaskCategory
} from '@/types/task';

export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

export const CATEGORY_OPTIONS = [
  'event_planning',
  'artist_management',
  'marketing',
  'travel',
  'logistics',
  'financial',
  'administrative',
  'creative'
] as const;

export const VARIABLE_TYPES = ['text', 'number', 'date', 'select', 'user', 'boolean'] as const;

export const templateVariableSchema = z.object({
  type: z.enum(VARIABLE_TYPES),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default_value: z.any().optional(),
  options: z.array(z.string()).optional()
});

export const templateItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(PRIORITY_OPTIONS),
  estimated_hours: z.number().min(0).optional(),
  due_offset_days: z.number().optional(),
  category: z.enum(CATEGORY_OPTIONS),
  order_index: z.number(),
  dependencies: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
});

export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(CATEGORY_OPTIONS),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  variables: z.record(templateVariableSchema).default({}),
  template_items: z.array(templateItemSchema).min(1, 'At least one task is required')
});

const defaultItem = {
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  category: 'administrative' as TaskCategory,
  order_index: 0,
  dependencies: [] as string[],
  metadata: {}
};

const defaultVariable: TemplateVariable = {
  type: 'text',
  label: '',
  description: '',
  required: false
};

export const getDefaultVariable = () => ({ ...defaultVariable });

export function buildTemplateDefaultValues(
  initialTemplate?: Partial<CreateTemplateFormData>
): CreateTemplateFormData {
  const templateItems = (initialTemplate?.template_items || []).map((item, index) => ({
    ...defaultItem,
    ...item,
    order_index: item.order_index ?? index,
    dependencies: item.dependencies || [],
    metadata: item.metadata || {}
  }));

  return {
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    category: initialTemplate?.category || 'administrative',
    is_public: initialTemplate?.is_public || false,
    tags: initialTemplate?.tags || [],
    variables: initialTemplate?.variables || {},
    template_items: templateItems.length > 0
      ? templateItems
      : [{ ...defaultItem }]
  };
}
