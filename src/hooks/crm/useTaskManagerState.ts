import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useCreateTask, useUpdateTask, useTaskTemplates } from '@/hooks/useTasks';
import { useTaskAssignees } from '@/hooks/useTaskAssignees';
import type {
  Task,
  TaskPriority,
  TaskSort,
  TasksResponse,
  CreateTaskFormData,
} from '@/types/task';
import { mapTaskFiltersToQuery } from '@/utils/taskFilters';
import type { TaskFilterState } from '@/components/crm/TaskFilters';

export type TaskManagerView = 'kanban' | 'list';

export interface TaskSummaryMetrics {
  total: number;
  open: number;
  overdue: number;
  dueSoon: number;
  completed: number;
}

export interface QuickTaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: 'unassigned' | string;
  dueDate: string;
}

const DEFAULT_FILTERS: TaskFilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  dueDate: 'all',
};

const DEFAULT_SORT: TaskSort = {
  field: 'due_date',
  direction: 'asc',
};

const QUICK_TASK_DEFAULTS: QuickTaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  assignee: 'unassigned',
  dueDate: '',
};

export const useTaskManagerState = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [view, setView] = useState<TaskManagerView>('kanban');
  const [filtersState, setFiltersState] = useState<TaskFilterState>(DEFAULT_FILTERS);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskForm, setQuickTaskForm] = useState<QuickTaskFormState>(QUICK_TASK_DEFAULTS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const routePresetApplied = useRef(false);

  const { data: assigneeData = [], isLoading: assigneesLoading } = useTaskAssignees();
  const { data: templatesData = [] } = useTaskTemplates();

  useEffect(() => {
    if (!routePresetApplied.current && location.pathname.endsWith('/my-tasks') && user?.id) {
      setFiltersState((previous) => ({
        ...previous,
        assignee: user.id,
      }));
      routePresetApplied.current = true;
    }
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (location.pathname.endsWith('/task-templates')) {
      setView('list');
    }
  }, [location.pathname]);

  const sort: TaskSort = DEFAULT_SORT;
  const computedFilters = useMemo(
    () => mapTaskFiltersToQuery(filtersState),
    [filtersState]
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useTasks(computedFilters, sort, 20);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const allTasks = useMemo<Task[]>(() => {
    if (!data?.pages) return [];
    return (data.pages as unknown as TasksResponse[]).flatMap((page) => page.tasks);
  }, [data?.pages]);

  const summary = useMemo<TaskSummaryMetrics>(() => {
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);

    let open = 0;
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;

    allTasks.forEach((task) => {
      const isOpen = task.status !== 'completed' && task.status !== 'cancelled';
      if (isOpen) open += 1;
      if (task.status === 'completed') completed += 1;

      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (isOpen && dueDate < now) {
          overdue += 1;
        }
        if (isOpen && dueDate >= now && dueDate <= weekAhead) {
          dueSoon += 1;
        }
      }
    });

    return {
      total: allTasks.length,
      open,
      overdue,
      dueSoon,
      completed,
    };
  }, [allTasks]);

  const templateDefaults = useMemo(() => {
    const defaults: { start_date: string; assignee_id?: string } = {
      start_date: new Date().toISOString().slice(0, 10),
    };

    if (user?.id) {
      defaults.assignee_id = user.id;
    }

    return defaults;
  }, [user?.id]);

  const updateQuickTaskForm = useCallback((updates: Partial<QuickTaskFormState>) => {
    setQuickTaskForm((previous) => ({
      ...previous,
      ...updates,
    }));
  }, []);

  const resetQuickTaskForm = useCallback(() => {
    setQuickTaskForm(QUICK_TASK_DEFAULTS);
  }, []);

  const handleCreateQuickTask = useCallback(() => {
    if (!quickTaskForm.title.trim() || createTask.isPending) {
      return;
    }

    const payload: CreateTaskFormData = {
      title: quickTaskForm.title.trim(),
      priority: quickTaskForm.priority,
      tags: [],
      category: 'administrative',
      is_recurring: false,
    };

    if (quickTaskForm.description) {
      payload.description = quickTaskForm.description;
    }
    if (quickTaskForm.dueDate) {
      payload.due_date = quickTaskForm.dueDate;
    }
    if (quickTaskForm.assignee !== 'unassigned') {
      payload.assignee_id = quickTaskForm.assignee;
    }

    createTask.mutate(payload, {
      onSuccess: () => {
        resetQuickTaskForm();
        setQuickTaskOpen(false);
      },
    });
  }, [createTask, quickTaskForm, resetQuickTaskForm]);

  const handleStatusChange = useCallback(
    async (task: Task, status: Task['status']) => {
      await updateTask.mutateAsync({
        id: task.id,
        updates: { status },
      });
    },
    [updateTask]
  );

  const handleViewChange = useCallback((nextView: TaskManagerView) => {
    setView(nextView);
  }, []);

  const toggleQuickTask = useCallback(() => {
    setQuickTaskOpen((previous) => !previous);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return {
    view,
    handleViewChange,
    filtersState,
    setFiltersState,
    resetFilters,
    summary,
    quickTask: {
      isOpen: quickTaskOpen,
      toggle: toggleQuickTask,
      close: () => setQuickTaskOpen(false),
      form: quickTaskForm,
      updateForm: updateQuickTaskForm,
      submit: handleCreateQuickTask,
      isSubmitting: createTask.isPending,
    },
    templates: {
      list: templatesData,
      selectedId: selectedTemplateId,
      setSelectedId: setSelectedTemplateId,
      dialogOpen: templateDialogOpen,
      setDialogOpen: setTemplateDialogOpen,
      defaults: templateDefaults,
    },
    tasks: {
      items: allTasks,
      isLoading,
      fetchNextPage,
      hasNextPage: Boolean(hasNextPage),
      isFetchingNextPage,
      refetch,
    },
    assignees: {
      list: assigneeData,
      isLoading: assigneesLoading,
    },
    isUpdatingTask: updateTask.isPending,
    handleStatusChange,
  };
};

export const TASK_MANAGER_DEFAULTS = {
  filters: DEFAULT_FILTERS,
  sort: DEFAULT_SORT,
  quickTask: QUICK_TASK_DEFAULTS,
};
