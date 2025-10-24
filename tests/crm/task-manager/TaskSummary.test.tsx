import { render } from '@testing-library/react';
import { TaskSummary } from '@/components/crm/task-manager/TaskSummary';

describe('TaskSummary', () => {
  it('displays formatted task metrics', () => {
    const { getByText } = render(
      <TaskSummary
        metrics={{
          total: 12,
          open: 7,
          overdue: 3,
          dueSoon: 4,
          completed: 5,
        }}
      />
    );

    expect(getByText('Total tasks')).toBeInTheDocument();
    expect(getByText('12')).toBeInTheDocument();
    expect(getByText('Open')).toBeInTheDocument();
    expect(getByText('7')).toBeInTheDocument();
    expect(getByText('Overdue')).toBeInTheDocument();
    expect(getByText('3')).toBeInTheDocument();
    expect(getByText('Completed')).toBeInTheDocument();
    expect(getByText('5')).toBeInTheDocument();
  });
});
