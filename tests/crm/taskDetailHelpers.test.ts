import type { Task } from '@/types/task';
import { computeDueState, getTaskStatusLabel } from '@/utils/taskDetail';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  title: 'Task',
  description: '',
  creator_id: 'creator-1',
  status: 'pending',
  priority: 'medium',
  due_date: new Date().toISOString(),
  estimated_hours: 1,
  actual_hours: 0,
  tags: [],
  category: 'administrative',
  metadata: {},
  progress_percentage: 0,
  is_recurring: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('task detail helpers', () => {
  it('returns overdue state when due date is past', () => {
    const task = makeTask({ due_date: new Date(Date.now() - 86400000).toISOString() });

    expect(computeDueState(task)).toBe('overdue');
  });

  it('returns upcoming state when task is completed', () => {
    const task = makeTask({
      status: 'completed',
      due_date: new Date(Date.now() - 86400000).toISOString(),
    });

    expect(computeDueState(task)).toBe('upcoming');
  });

  it('exposes human readable status label', () => {
    expect(getTaskStatusLabel('in_progress')).toBe('In Progress');
  });
});
