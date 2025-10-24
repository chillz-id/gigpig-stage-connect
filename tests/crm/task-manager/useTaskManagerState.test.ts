import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskManagerState } from '@/hooks/crm/useTaskManagerState';
import type { Task } from '@/types/task';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useTaskTemplates,
} from '@/hooks/useTasks';
import { useTaskAssignees } from '@/hooks/useTaskAssignees';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useTasks', () => ({
  useTasks: jest.fn(),
  useCreateTask: jest.fn(),
  useUpdateTask: jest.fn(),
  useTaskTemplates: jest.fn(),
}));

jest.mock('@/hooks/useTaskAssignees', () => ({
  useTaskAssignees: jest.fn(),
}));

const createTaskFixture = (overrides: Partial<Task>): Task =>
  ({
    id: 'task-id',
    title: 'Example task',
    creator_id: 'creator-1',
    status: 'pending',
    priority: 'medium',
    due_date: undefined,
    estimated_hours: undefined,
    actual_hours: 0,
    tags: [],
    category: 'administrative',
    metadata: {},
    progress_percentage: 0,
    is_recurring: false,
    recurrence_pattern: undefined,
    completed_at: undefined,
    created_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2025-01-01T00:00:00Z').toISOString(),
    ...overrides,
  }) as Task;

describe('useTaskManagerState', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;
  const mockUseCreateTask = useCreateTask as jest.MockedFunction<typeof useCreateTask>;
  const mockUseUpdateTask = useUpdateTask as jest.MockedFunction<typeof useUpdateTask>;
  const mockUseTaskTemplates = useTaskTemplates as jest.MockedFunction<typeof useTaskTemplates>;
  const mockUseTaskAssignees = useTaskAssignees as jest.MockedFunction<typeof useTaskAssignees>;
  const mockUseLocation = useLocation as unknown as jest.Mock;

  const overdueTask = createTaskFixture({
    id: 'task-overdue',
    status: 'in_progress',
    due_date: new Date('2025-01-10T00:00:00Z').toISOString(),
  });
  const dueSoonTask = createTaskFixture({
    id: 'task-due-soon',
    status: 'in_progress',
    due_date: new Date('2025-01-18T00:00:00Z').toISOString(),
  });
  const completedTask = createTaskFixture({
    id: 'task-complete',
    status: 'completed',
    due_date: new Date('2025-01-11T00:00:00Z').toISOString(),
  });

  const tasksPage = {
    tasks: [overdueTask, dueSoonTask, completedTask],
    total_count: 3,
    page: 1,
    page_size: 20,
    has_more: false,
  };

  let createTaskMutate: jest.Mock;
  let updateTaskMutateAsync: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    createTaskMutate = jest.fn();
    updateTaskMutateAsync = jest.fn().mockResolvedValue(undefined);

    mockUseLocation.mockReturnValue({ pathname: '/crm/tasks' });
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' } as any,
      session: null,
      profile: null,
      roles: [],
      isLoading: false,
      isFirstLogin: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn(),
      hasRole: jest.fn().mockReturnValue(false),
      hasAnyRole: jest.fn().mockReturnValue(false),
      isCoPromoterForEvent: jest.fn().mockResolvedValue(false),
      markFirstLoginComplete: jest.fn(),
    } as ReturnType<typeof useAuth>);
    mockUseTasks.mockReturnValue({
      data: { pages: [tasksPage] },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    } as any);
    mockUseCreateTask.mockReturnValue({
      mutate: createTaskMutate,
      isPending: false,
    } as any);
    mockUseUpdateTask.mockReturnValue({
      mutateAsync: updateTaskMutateAsync,
      isPending: false,
    } as any);
    mockUseTaskTemplates.mockReturnValue({
      data: [],
    } as any);
    mockUseTaskAssignees.mockReturnValue({
      data: [{ id: 'user-1', name: 'Alice' }],
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('computes task summary metrics from fetched data', () => {
    const { result } = renderHook(() => useTaskManagerState());

    expect(result.current.summary).toEqual({
      total: 3,
      open: 2,
      overdue: 1,
      dueSoon: 1,
      completed: 1,
    });
  });

  it('preselects current user when navigating to my tasks', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/crm/my-tasks' });

    const { result } = renderHook(() => useTaskManagerState());

    await waitFor(() => {
      expect(result.current.filtersState.assignee).toBe('user-1');
    });
  });

  it('switches to list view on task templates route', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/crm/task-templates' });

    const { result } = renderHook(() => useTaskManagerState());

    await waitFor(() => {
      expect(result.current.view).toBe('list');
    });
  });

  it('submits quick task payload and resets state on success', () => {
    const { result } = renderHook(() => useTaskManagerState());

    act(() => {
      result.current.quickTask.toggle();
    });

    act(() => {
      result.current.quickTask.updateForm({
        title: 'Follow up with venue',
        description: 'Confirm lighting requirements',
        assignee: 'user-1',
        dueDate: '2025-01-20',
        priority: 'high',
      });
    });

    act(() => {
      result.current.quickTask.submit();
    });

    expect(createTaskMutate).toHaveBeenCalledTimes(1);
    const [payload, options] = createTaskMutate.mock.calls[0];
    expect(payload).toEqual({
      title: 'Follow up with venue',
      description: 'Confirm lighting requirements',
      assignee_id: 'user-1',
      due_date: '2025-01-20',
      priority: 'high',
      tags: [],
      category: 'administrative',
      is_recurring: false,
    });

    act(() => {
      options?.onSuccess?.();
    });

    expect(result.current.quickTask.isOpen).toBe(false);
    expect(result.current.quickTask.form.title).toBe('');
    expect(result.current.quickTask.form.description).toBe('');
  });

  it('updates task status via mutateAsync handler', async () => {
    const { result } = renderHook(() => useTaskManagerState());

    await act(async () => {
      await result.current.handleStatusChange(overdueTask, 'completed');
    });

    expect(updateTaskMutateAsync).toHaveBeenCalledWith({
      id: 'task-overdue',
      updates: { status: 'completed' },
    });
  });
});
