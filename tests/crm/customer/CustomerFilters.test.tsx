import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerFilters } from '@/components/crm/CustomerFilters';

jest.mock('@/hooks/useCustomers', () => ({
  useCustomerSegmentCounts: jest.fn(),
  useCustomerSources: jest.fn(),
}));

jest.mock('@/hooks/crm/useSegmentManager', () => ({
  useSegmentManager: jest.fn(),
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

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
}));

const { useCustomerSegmentCounts, useCustomerSources } = jest.requireMock('@/hooks/useCustomers') as {
  useCustomerSegmentCounts: jest.Mock;
  useCustomerSources: jest.Mock;
};

const { useSegmentManager } = jest.requireMock('@/hooks/crm/useSegmentManager') as {
  useSegmentManager: jest.Mock;
};

const createSegmentManagerMock = () => ({
  dialogOpen: false,
  setDialogOpen: jest.fn(),
  openDialog: jest.fn(),
  closeDialog: jest.fn(),
  isSubmitting: false,
  form: { name: '', color: '' },
  updateForm: jest.fn(),
  submit: jest.fn(),
  previewColor: null,
  clearColour: jest.fn(),
  defaultColourSwatch: '#9ca3af',
});

describe('CustomerFilters', () => {
  beforeEach(() => {
    useCustomerSegmentCounts.mockReturnValue({
      data: [
        { slug: 'vip', name: 'VIP', color: null, count: 5 },
        { slug: 'new', name: 'New', color: null, count: 3 },
      ],
    });
    useCustomerSources.mockReturnValue({ data: ['Website', 'Referral'] });
    useSegmentManager.mockReturnValue(createSegmentManagerMock());
  });

  it('submits search query', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    const onReset = jest.fn();

    render(
      <CustomerFilters
        filters={{}}
        onFiltersChange={onFiltersChange}
        onReset={onReset}
      />
    );

    const input = screen.getByPlaceholderText('Search by name or email...');
    await user.type(input, 'Acme');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'Acme' }));
  });

  it('toggles segment filters', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();

    render(
      <CustomerFilters
        filters={{}}
        onFiltersChange={onFiltersChange}
        onReset={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /vip/i }));

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ segments: ['vip'] }));
  });

  it('opens segment creation dialog', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    const segmentManagerMock = createSegmentManagerMock();
    useSegmentManager.mockReturnValue(segmentManagerMock);

    render(
      <CustomerFilters
        filters={{}}
        onFiltersChange={onFiltersChange}
        onReset={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /new segment/i }));
    expect(segmentManagerMock.openDialog).toHaveBeenCalled();
  });

  it('updates advanced numeric filters', async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();

    render(
      <CustomerFilters
        filters={{}}
        onFiltersChange={onFiltersChange}
        onReset={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /filters/i }));

    const minInput = screen.getByPlaceholderText('0');
    fireEvent.change(minInput, { target: { value: '100' } });

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ minSpent: 100 }));
  });
});
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
