import { supabase } from '@/integrations/supabase/client';
import type {
  Task,
  TaskTemplate,
  TaskTemplateItem,
  CreateTemplateFormData,
  ApplyTemplateData
} from '@/types/task';

async function getCreatorId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

function buildTemplateVariables(
  item: TaskTemplateItem,
  applyData: ApplyTemplateData
) {
  let title = item.title;
  let description = item.description || '';

  Object.entries(applyData.variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    const stringValue = String(value);
    title = title.replace(new RegExp(placeholder, 'g'), stringValue);
    description = description.replace(new RegExp(placeholder, 'g'), stringValue);
  });

  let dueDate: string | undefined;
  if (item.due_offset_days !== undefined) {
    const due = new Date(applyData.start_date || new Date());
    due.setDate(due.getDate() + item.due_offset_days);
    dueDate = due.toISOString();
  }

  return {
    title,
    description,
    priority: item.priority,
    category: item.category,
    estimated_hours: item.estimated_hours,
    due_date: dueDate,
    metadata: {
      ...item.metadata,
      template_item_id: item.id,
      applied_variables: applyData.variables,
      ...(applyData.project_id && { project_id: applyData.project_id })
    }
  };
}

export const taskTemplateService = {
  async getTemplates(
    isPublic?: boolean,
    category?: string,
    search?: string
  ): Promise<TaskTemplate[]> {
    let query = supabase
      .from('task_templates')
      .select(`
        *,
        creator:creator_id(id, name, email),
        template_items:task_template_items(*)
      `)
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTemplate(id: string): Promise<TaskTemplate> {
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        creator:creator_id(id, name, email),
        template_items:task_template_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Template not found');
    return data;
  },

  async createTemplate(templateData: CreateTemplateFormData): Promise<TaskTemplate> {
    const { template_items, ...templateFields } = templateData;

    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .insert([{ ...templateFields, creator_id: await getCreatorId() }])
      .select()
      .single();

    if (templateError) throw templateError;

    const itemsWithTemplateId = template_items.map(item => ({
      ...item,
      template_id: template.id
    }));

    const { error: itemsError } = await supabase
      .from('task_template_items')
      .insert(itemsWithTemplateId);

    if (itemsError) throw itemsError;

    return taskTemplateService.getTemplate(template.id);
  },

  async applyTemplate(applyData: ApplyTemplateData): Promise<Task[]> {
    const template = await taskTemplateService.getTemplate(applyData.template_id);

    const tasksToCreate = template.template_items?.map(item => ({
      ...buildTemplateVariables(item, applyData),
      assignee_id: applyData.assignee_id,
      template_id: applyData.template_id
    })) || [];

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select(`
        *,
        assignee:assignee_id(id, name, email, avatar_url),
        creator:creator_id(id, name, email, avatar_url)
      `);

    if (error) throw error;

    await supabase
      .from('task_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', applyData.template_id);

    return data || [];
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export default taskTemplateService;
