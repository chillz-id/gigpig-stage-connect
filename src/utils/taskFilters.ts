import type { TaskFilters as TaskFilterInput, TaskPriority, TaskStatus } from '@/types/task';
import type { TaskFilterState } from '@/components/crm/TaskFilters';

const formatISODate = (date: Date): string => date.toISOString().slice(0, 10);

export const mapTaskFiltersToQuery = (filtersState: TaskFilterState): TaskFilterInput => {
  const filters: TaskFilterInput = {};

  if (filtersState.search) {
    filters.search = filtersState.search;
  }
  if (filtersState.status !== 'all') {
    filters.status = [filtersState.status as TaskStatus];
  }
  if (filtersState.priority !== 'all') {
    filters.priority = [filtersState.priority as TaskPriority];
  }
  if (filtersState.assignee === 'unassigned') {
    filters.assignee_is_null = true;
  } else if (filtersState.assignee !== 'all') {
    filters.assignee_id = [filtersState.assignee];
  }

  const now = new Date();
  if (filtersState.dueDate === 'overdue') {
    filters.is_overdue = true;
  } else if (filtersState.dueDate === 'today') {
    const today = formatISODate(now);
    filters.due_date_range = { start: today, end: today };
  } else if (filtersState.dueDate === 'week') {
    const start = formatISODate(now);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7);
    const end = formatISODate(endDate);
    filters.due_date_range = { start, end };
  }

  return filters;
};
