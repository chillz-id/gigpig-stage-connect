import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnTemplateManager } from '@/components/crm/column-customizer/ColumnTemplateManager';

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
  const SelectContext = React.createContext<{ onValueChange: (value: string) => void } | null>(null);

  const Select = ({ children, onValueChange }: any) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
    (props, ref) => (
      <button ref={ref} role="combobox" type="button" {...props}>
        {props.children}
      </button>
    )
  );
  SelectTrigger.displayName = 'SelectTrigger';

  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;

  const SelectContent = ({ children }: { children: React.ReactNode }) => <div role="listbox">{children}</div>;

  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
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

const templates = [
  {
    id: 'default',
    name: 'All Columns',
    description: 'Show all columns',
    isDefault: true,
    configs: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'custom-1',
    name: 'Custom View',
    description: 'A tailored set of columns',
    isDefault: false,
    configs: [],
    createdAt: new Date().toISOString(),
  },
];

describe('ColumnTemplateManager', () => {
  it('invokes handlers for template selection and actions', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();
    const handleSave = jest.fn();
    const handleDelete = jest.fn();
    const handleReset = jest.fn();

    render(
      <ColumnTemplateManager
        templates={templates}
        activeTemplateId="custom-1"
        onSelect={handleSelect}
        onRequestSave={handleSave}
        onRequestDelete={handleDelete}
        onResetToDefaults={handleReset}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'All Columns' }));

    expect(handleSelect).toHaveBeenCalledWith('default');

    await user.click(screen.getByRole('button', { name: /save as new template/i }));
    expect(handleSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /delete current template/i }));
    expect(handleDelete).toHaveBeenCalledWith('custom-1');

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
