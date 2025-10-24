import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickTaskForm } from '@/components/crm/task-manager/QuickTaskForm';
import type { QuickTaskFormState } from '@/hooks/crm/useTaskManagerState';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'business',
    setTheme: jest.fn(),
    autoTheme: false,
    setAutoTheme: jest.fn(),
    schedule: { enabled: false, businessStart: '09:00', businessEnd: '17:00', autoSwitch: false },
    setSchedule: jest.fn(),
    getRecommendedTheme: () => 'business',
  }),
}));

jest.mock('@/components/ui/select', () => {
  const React = require('react') as typeof import('react');

  type SelectContextValue = { onValueChange: (value: string) => void };
  const SelectContext = React.createContext<SelectContextValue | null>(null);

  const Select = ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div data-testid="mock-select">{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    (props, ref) => <button ref={ref} role="combobox" type="button" {...props} />
  );
  SelectTrigger.displayName = 'SelectTrigger';

  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <div role="listbox">{children}</div>;

  const SelectItem = ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => {
    const context = React.useContext(SelectContext);
    return (
      <button type="button" role="option" onClick={() => context?.onValueChange(value)}>
        {children}
      </button>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

const defaultForm: QuickTaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  assignee: 'unassigned',
  dueDate: '',
};

describe('QuickTaskForm', () => {
  it('does not render content when closed', () => {
    const { queryByText } = render(
      <QuickTaskForm
        isOpen={false}
        form={defaultForm}
        assignees={[]}
        isSubmitting={false}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(queryByText('Quick task creation')).not.toBeInTheDocument();
  });

  it('captures field interactions and submit actions', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const handleSubmit = jest.fn();
    const handleCancel = jest.fn();

    const { getByLabelText, getByRole, findByRole } = render(
      <QuickTaskForm
        isOpen
        form={defaultForm}
        assignees={[{ id: 'user-1', name: 'Alice' }]}
        isSubmitting={false}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );

    fireEvent.change(getByLabelText('Title'), { target: { value: 'Site visit' } });
    expect(handleChange).toHaveBeenCalledWith({ title: 'Site visit' });

    fireEvent.change(getByLabelText('Due date'), { target: { value: '2025-01-22' } });
    expect(handleChange).toHaveBeenCalledWith({ dueDate: '2025-01-22' });

    const priorityTrigger = getByLabelText('Priority');
    await user.click(priorityTrigger);
    await user.click(await findByRole('option', { name: 'High' }));
    expect(handleChange).toHaveBeenCalledWith({ priority: 'high' });

    const assigneeTrigger = getByLabelText('Assignee');
    await user.click(assigneeTrigger);
    await user.click(await findByRole('option', { name: 'Alice' }));
    expect(handleChange).toHaveBeenCalledWith({ assignee: 'user-1' });

    fireEvent.change(getByLabelText('Description'), {
      target: { value: 'Meet the venue team on-site.' },
    });
    expect(handleChange).toHaveBeenCalledWith({
      description: 'Meet the venue team on-site.',
    });

    await user.click(getByRole('button', { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    await user.click(getByRole('button', { name: /create task/i }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit button while submitting', () => {
    const { getByRole } = render(
      <QuickTaskForm
        isOpen
        form={defaultForm}
        assignees={[]}
        isSubmitting
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByRole('button', { name: /create task/i })).toBeDisabled();
  });
});
