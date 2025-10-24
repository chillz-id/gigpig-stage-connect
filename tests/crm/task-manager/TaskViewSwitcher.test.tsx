import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskViewSwitcher } from '@/components/crm/task-manager/TaskViewSwitcher';
import type { TaskTemplate } from '@/types/task';

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

const baseTemplate = {
  id: 'template-1',
  name: 'Template One',
  description: '',
  category: 'administrative',
  creator_id: 'creator-1',
  is_public: false,
  is_system_template: false,
  variables: {},
  tags: [],
  usage_count: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
} as TaskTemplate;

const renderSwitcher = (overrides: Partial<React.ComponentProps<typeof TaskViewSwitcher>> = {}) => {
  const handlers = {
    onViewChange: jest.fn(),
    onTemplateChange: jest.fn(),
    onOpenTemplateDialog: jest.fn(),
    onToggleQuickTask: jest.fn(),
  };

  const props: React.ComponentProps<typeof TaskViewSwitcher> = {
    view: 'kanban' as const,
    templates: [baseTemplate],
    isQuickTaskOpen: false,
    ...handlers,
    ...overrides,
  };

  return {
    renderResult: render(<TaskViewSwitcher {...props} />),
    props,
    handlers,
  };
};

describe('TaskViewSwitcher', () => {
  it('invokes view change callback when switching tabs', async () => {
    const user = userEvent.setup();
    const { renderResult, handlers } = renderSwitcher();

    await user.click(renderResult.getByRole('tab', { name: /list/i }));

    expect(handlers.onViewChange).toHaveBeenCalledWith('list');
  });

  it('opens template dialog when action button is pressed', async () => {
    const user = userEvent.setup();
    const { renderResult, props, handlers } = renderSwitcher();

    expect(renderResult.getByRole('button', { name: /apply template/i })).toBeDisabled();

    renderResult.rerender(
      <TaskViewSwitcher
        {...props}
        selectedTemplateId="template-1"
      />
    );

    const applyButton = renderResult.getByRole('button', { name: /apply template/i });
    expect(applyButton).not.toBeDisabled();

    await user.click(applyButton);
    expect(handlers.onOpenTemplateDialog).toHaveBeenCalledTimes(1);
  });

  it('shares template selection changes with parent callbacks', async () => {
    const user = userEvent.setup();
    const { renderResult, handlers } = renderSwitcher();

    const selectTrigger = renderResult.getByRole('combobox');
    await user.click(selectTrigger);
    const option = await renderResult.findByRole('option', { name: 'Template One' });
    await user.click(option);

    expect(handlers.onTemplateChange).toHaveBeenCalledWith('template-1');
  });

  it('toggles quick task state through button interaction', async () => {
    const user = userEvent.setup();
    const { renderResult, props, handlers } = renderSwitcher({ isQuickTaskOpen: false });

    await user.click(renderResult.getByRole('button', { name: /quick task/i }));
    expect(handlers.onToggleQuickTask).toHaveBeenCalledTimes(1);

    renderResult.rerender(<TaskViewSwitcher {...props} isQuickTaskOpen />);

    expect(renderResult.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});
