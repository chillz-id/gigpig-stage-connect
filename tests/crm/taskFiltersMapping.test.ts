import type { TaskFilterState } from '@/components/crm/TaskFilters';
import { mapTaskFiltersToQuery } from '@/utils/taskFilters';

describe('mapTaskFiltersToQuery', () => {
  const baseState: TaskFilterState = {
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
  };

  it('maps unassigned filter to Supabase null equality', () => {
    const query = mapTaskFiltersToQuery({ ...baseState, assignee: 'unassigned' });

    expect(query.assignee_is_null).toBe(true);
    expect(query.assignee_id).toBeUndefined();
  });

  it('includes explicit assignee ids when provided', () => {
    const query = mapTaskFiltersToQuery({ ...baseState, assignee: 'user-123' });

    expect(query.assignee_id).toEqual(['user-123']);
    expect(query.assignee_is_null).toBeUndefined();
  });

  it('adds overdue flag for overdue filter', () => {
    const query = mapTaskFiltersToQuery({ ...baseState, dueDate: 'overdue' });

    expect(query.is_overdue).toBe(true);
    expect(query.due_date_range).toBeUndefined();
  });
});
