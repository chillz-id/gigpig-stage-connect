// TypeScript types for the task management system

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 
  | 'event_planning' 
  | 'artist_management' 
  | 'marketing' 
  | 'travel' 
  | 'logistics' 
  | 'financial' 
  | 'administrative' 
  | 'creative';
export type ReminderType = 'due_date' | 'custom' | 'recurring';

// Main task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  creator_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  tags: string[];
  category: TaskCategory;
  metadata: Record<string, any>;
  parent_task_id?: string;
  template_id?: string;
  progress_percentage: number;
  is_recurring: boolean;
  recurrence_pattern?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  parent_task?: Task;
  subtasks?: Task[];
  comments?: TaskComment[];
  reminders?: TaskReminder[];
  template?: TaskTemplate;
}

// Task comment interface
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachments: TaskAttachment[];
  is_system_comment: boolean;
  created_at: string;
  
  // Populated relations
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// Task attachment interface
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

// Task reminder interface
export interface TaskReminder {
  id: string;
  task_id: string;
  reminder_type: ReminderType;
  remind_at: string;
  message?: string;
  sent: boolean;
  sent_at?: string;
  recurring_interval?: string;
  created_at: string;
}

// Task template interface
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: TaskCategory;
  creator_id: string;
  is_public: boolean;
  is_system_template: boolean;
  variables: Record<string, TemplateVariable>;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
  
  // Populated relations
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  template_items?: TaskTemplateItem[];
}

// Template variable types
export type TemplateVariableType = 'text' | 'number' | 'date' | 'select' | 'user' | 'boolean';

export interface TemplateVariable {
  type: TemplateVariableType;
  label: string;
  description?: string;
  required?: boolean;
  default_value?: any;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Task template item interface
export interface TaskTemplateItem {
  id: string;
  template_id: string;
  title: string; // Can contain variables like "Confirm {venue_name} booking"
  description?: string;
  priority: TaskPriority;
  estimated_hours?: number;
  due_offset_days?: number; // Days from template application date
  category: TaskCategory;
  order_index: number;
  dependencies: string[]; // Other template item IDs
  metadata: Record<string, any>;
  created_at: string;
}

// Form interfaces for creating/updating tasks
export interface CreateTaskFormData {
  title: string;
  description?: string;
  assignee_id?: string;
  priority: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  tags: string[];
  category: TaskCategory;
  parent_task_id?: string;
  template_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateTaskFormData extends Partial<CreateTaskFormData> {
  status?: TaskStatus;
  actual_hours?: number;
  progress_percentage?: number;
}

// Template application interface
export interface ApplyTemplateData {
  template_id: string;
  variables: Record<string, any>; // Variable values to substitute
  start_date?: string; // Base date for calculating due dates
  assignee_id?: string; // Default assignee for all tasks
  project_id?: string; // Optional project/tour/event to associate with
}

// Template creation interface
export interface CreateTemplateFormData {
  name: string;
  description?: string;
  category: TaskCategory;
  is_public?: boolean;
  variables: Record<string, TemplateVariable>;
  tags: string[];
  template_items: CreateTemplateItemFormData[];
}

export interface CreateTemplateItemFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  estimated_hours?: number;
  due_offset_days?: number;
  category: TaskCategory;
  order_index: number;
  dependencies: string[];
  metadata?: Record<string, any>;
}

// Filter and search interfaces
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignee_id?: string[];
  creator_id?: string[];
  tags?: string[];
  due_date_range?: {
    start?: string;
    end?: string;
  };
  search?: string;
  parent_task_id?: string;
  template_id?: string;
  has_subtasks?: boolean;
  is_overdue?: boolean;
}

export interface TaskSort {
  field: 'title' | 'due_date' | 'created_at' | 'updated_at' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

// Dashboard and analytics interfaces
export interface TaskStatistics {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  high_priority_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
  tasks_by_category: Record<TaskCategory, number>;
  completion_rate: number;
  average_completion_time: number; // In hours
}

export interface UserTaskStatistics extends TaskStatistics {
  assigned_tasks: number;
  created_tasks: number;
  tasks_due_today: number;
  tasks_due_this_week: number;
}

// Time tracking interfaces
export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTimeReport {
  task_id: string;
  task_title: string;
  estimated_hours: number;
  actual_hours: number;
  time_entries: TimeEntry[];
  total_duration_minutes: number;
  efficiency_ratio: number; // actual vs estimated
}

// Notification interfaces
export interface TaskNotification {
  id: string;
  task_id: string;
  user_id: string;
  type: 'due_soon' | 'overdue' | 'assigned' | 'completed' | 'comment_added' | 'status_changed';
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any>;
  created_at: string;
}

// Bulk operations interfaces
export interface BulkTaskOperation {
  task_ids: string[];
  operation: 'update_status' | 'update_assignee' | 'update_priority' | 'delete' | 'archive';
  data: Record<string, any>;
}

export interface BulkOperationResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    task_id: string;
    error: string;
  }>;
}

// API response interfaces
export interface TasksResponse {
  tasks: Task[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface TemplatesResponse {
  templates: TaskTemplate[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Hook return types
export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export interface UseTaskReturn {
  task: Task | null;
  isLoading: boolean;
  error: Error | null;
  updateTask: (updates: UpdateTaskFormData) => Promise<void>;
  deleteTask: () => Promise<void>;
  addComment: (content: string, attachments?: File[]) => Promise<void>;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
}

export interface UseTemplatesReturn {
  templates: TaskTemplate[];
  isLoading: boolean;
  error: Error | null;
  createTemplate: (data: CreateTemplateFormData) => Promise<TaskTemplate>;
  applyTemplate: (data: ApplyTemplateData) => Promise<Task[]>;
  deleteTemplate: (id: string) => Promise<void>;
}

// Integration interfaces for other systems
export interface TaskEventIntegration {
  event_id: string;
  event_title: string;
  event_date: string;
  venue_name: string;
  related_tasks: Task[];
}

export interface TaskTourIntegration {
  tour_id: string;
  tour_name: string;
  tour_dates: {
    start: string;
    end: string;
  };
  related_tasks: Task[];
}

export interface TaskAgencyIntegration {
  agency_id: string;
  agency_name: string;
  artist_id?: string;
  artist_name?: string;
  related_tasks: Task[];
}

// Calendar integration
export interface TaskCalendarEvent {
  id: string;
  task_id: string;
  title: string;
  start: string;
  end?: string;
  all_day: boolean;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_name?: string;
}

// Export collections
export type TaskManagementTypes = {
  Task: Task;
  TaskComment: TaskComment;
  TaskReminder: TaskReminder;
  TaskTemplate: TaskTemplate;
  TaskTemplateItem: TaskTemplateItem;
  CreateTaskFormData: CreateTaskFormData;
  UpdateTaskFormData: UpdateTaskFormData;
  ApplyTemplateData: ApplyTemplateData;
  TaskFilters: TaskFilters;
  TaskStatistics: TaskStatistics;
  TimeEntry: TimeEntry;
  TaskNotification: TaskNotification;
};