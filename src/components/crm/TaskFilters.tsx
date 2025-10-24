import { Search, Filter as FilterIcon, Calendar, Shuffle, User, AlertTriangle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { TaskPriority, TaskStatus } from '@/types/task';
import type { TaskAssigneeOption } from '@/hooks/useTaskAssignees';

export interface TaskFilterState {
  search: string;
  status: 'all' | TaskStatus;
  priority: 'all' | TaskPriority;
  assignee: 'all' | 'unassigned' | string;
  dueDate: 'all' | 'overdue' | 'today' | 'week';
}

interface TaskFiltersProps {
  value: TaskFilterState;
  onChange: (value: TaskFilterState) => void;
  assignees: TaskAssigneeOption[];
  isLoadingAssignees?: boolean;
  onReset?: () => void;
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const priorityLabels: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const TaskFilters = ({
  value,
  onChange,
  assignees,
  isLoadingAssignees = false,
  onReset,
}: TaskFiltersProps) => {
  const hasActiveFilters =
    value.search ||
    value.status !== 'all' ||
    value.priority !== 'all' ||
    value.assignee !== 'all' ||
    value.dueDate !== 'all';

  const handleChange = (updates: Partial<TaskFilterState>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              onReset?.();
              if (!onReset) {
                onChange({
                  search: '',
                  status: 'all',
                  priority: 'all',
                  assignee: 'all',
                  dueDate: 'all',
                });
              }
            }}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title or description..."
            value={value.search}
            onChange={(event) => handleChange({ search: event.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={value.status}
          onValueChange={(next) => handleChange({ status: next as TaskFilterState['status'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status">
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
                <span>
                  {value.status === 'all' ? 'All Statuses' : statusLabels[value.status as TaskStatus]}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([status, label]) => (
              <SelectItem key={status} value={status}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.priority}
          onValueChange={(next) =>
            handleChange({ priority: next as TaskFilterState['priority'] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span>
                  {value.priority === 'all'
                    ? 'All Priorities'
                    : priorityLabels[value.priority as TaskPriority]}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(priorityLabels).map(([priority, label]) => (
              <SelectItem key={priority} value={priority}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.assignee}
          onValueChange={(next) => handleChange({ assignee: next as TaskFilterState['assignee'] })}
          disabled={isLoadingAssignees}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assignee">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {value.assignee === 'all'
                    ? 'All Assignees'
                    : value.assignee === 'unassigned'
                    ? 'Unassigned'
                    : assignees.find((assignee) => assignee.id === value.assignee)?.name ||
                      'Assignee'}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.dueDate}
          onValueChange={(next) =>
            handleChange({ dueDate: next as TaskFilterState['dueDate'] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Due Date">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {
                    {
                      all: 'All Due Dates',
                      overdue: 'Overdue',
                      today: 'Due Today',
                      week: 'Due This Week',
                    }[value.dueDate]
                  }
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Due Dates</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due Today</SelectItem>
            <SelectItem value="week">Due This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Active:</span>
          {value.search && (
            <Badge variant="secondary" className="gap-2">
              <Search className="h-3 w-3" />
              {value.search}
            </Badge>
          )}
          {value.status !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <Shuffle className="h-3 w-3" />
              {statusLabels[value.status as TaskStatus]}
            </Badge>
          )}
          {value.priority !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <AlertTriangle className="h-3 w-3" />
              {priorityLabels[value.priority as TaskPriority]}
            </Badge>
          )}
          {value.assignee !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <User className="h-3 w-3" />
              {value.assignee === 'unassigned'
                ? 'Unassigned'
                : assignees.find((assignee) => assignee.id === value.assignee)?.name ||
                  'Assignee'}
            </Badge>
          )}
          {value.dueDate !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              <Calendar className="h-3 w-3" />
              {
                {
                  overdue: 'Overdue',
                  today: 'Due Today',
                  week: 'Due This Week',
                }[value.dueDate]
              }
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
