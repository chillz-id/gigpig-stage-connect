import { groupTasksByStatus } from '@/components/crm/TaskKanban';
import type { Task, TaskStatus } from '@/types/task';

const makeTask = (status: TaskStatus, overrides: Partial<Task> = {}): Task => ({
  id: `${status}-${Math.random().toString(36).slice(2, 8)}`,
  title: `${status} task`,
  description: '',
  creator_id: 'creator-1',
  status,
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

describe('groupTasksByStatus', () => {
  it('clusters tasks into status buckets', () => {
    const tasks: Task[] = [
      makeTask('pending'),
      makeTask('pending'),
      makeTask('review'),
      makeTask('completed'),
    ];

    const grouped = groupTasksByStatus(tasks);

    expect(grouped.pending).toHaveLength(2);
    expect(grouped.review).toHaveLength(1);
    expect(grouped.completed).toHaveLength(1);
    expect(grouped.cancelled).toHaveLength(0);
  });

  it('ignores unknown status values gracefully', () => {
    const tasks = [
      makeTask('pending'),
      { ...makeTask('pending'), status: 'invalid' } as unknown as Task,
    ];

    const grouped = groupTasksByStatus(tasks);

    expect(grouped.pending).toHaveLength(1);
  });
});
