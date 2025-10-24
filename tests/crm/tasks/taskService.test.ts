const selectMock = jest.fn();
const fromMock = jest.fn(() => ({
  select: selectMock,
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('taskService.listAssigneeOptions', () => {
  // Defer require until after mocks
  const { taskService } = require('@/services/task/task-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps profiles to assignee options with fallback ordering', async () => {
    const orderSecond = jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'Primary Name', email: 'primary@example.com' },
        { id: '2', full_name: 'Full Named', email: 'full@example.com' },
        { id: '3', first_name: 'First', last_name: 'Last', email: 'combo@example.com' },
        { id: '4', email: 'lonely@example.com' },
      ],
      error: null,
    });
    const orderFirst = jest.fn(() => ({ order: orderSecond }));
    selectMock.mockReturnValue({ order: orderFirst });

    const options = await taskService.listAssigneeOptions();

    expect(fromMock).toHaveBeenCalledWith('profiles');
    expect(selectMock).toHaveBeenCalledWith('id, name, full_name, first_name, last_name, email');
    expect(orderFirst).toHaveBeenCalledWith('name', { ascending: true });
    expect(orderSecond).toHaveBeenCalledWith('full_name', { ascending: true });
    expect(options).toEqual([
      { id: '1', name: 'Primary Name', email: 'primary@example.com' },
      { id: '2', name: 'Full Named', email: 'full@example.com' },
      { id: '3', name: 'First Last', email: 'combo@example.com' },
      { id: '4', name: 'lonely@example.com', email: 'lonely@example.com' },
    ]);
  });

  it('throws when Supabase returns an error', async () => {
    const failure = new Error('boom');
    const orderSecond = jest.fn().mockResolvedValue({ data: null, error: failure });
    const orderFirst = jest.fn(() => ({ order: orderSecond }));
    selectMock.mockReturnValue({ order: orderFirst });

    await expect(taskService.listAssigneeOptions()).rejects.toThrow(failure);
  });
});
