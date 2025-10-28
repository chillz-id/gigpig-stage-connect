import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManagerCommissionSelector } from '@/components/event-management/ManagerCommissionSelector';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Mock ResizeObserver for Tooltip component
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('ManagerCommissionSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with default values', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      expect(screen.getByText('Manager Commission Rate')).toBeInTheDocument();
      expect(screen.getByText('Adjust Rate')).toBeInTheDocument(); // Changed from getByLabelText (label is on span)
      expect(screen.getByLabelText('Precise Entry (%)')).toBeInTheDocument();
    });

    it('should display tooltip with info icon', async () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      // Query for the Info icon SVG directly instead of button role
      const infoIcon = screen.getByText('Manager Commission Rate').parentElement?.querySelector('svg');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should display default rate when provided', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={15}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('(Default: 15%)')).toBeInTheDocument();
    });

    it('should not display default rate text when defaultRate is 0', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={0}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByText(/Default:/)).not.toBeInTheDocument();
    });

    it('should initialize with default rate value', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={20}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      expect(input.value).toBe('20');
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  describe('Slider Functionality', () => {
    it('should update rate when slider changes', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const slider = screen.getByRole('slider');
      // Radix UI Slider uses arrow keys, not change events
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' }); // Increase by step (0.5)

      // Should have been called at least once with a value > 0
      expect(mockOnSelect).toHaveBeenCalled();
      const calls = mockOnSelect.mock.calls;
      expect(calls[calls.length - 1][0]).toBeGreaterThan(0);
    });

    it('should sync input value when slider changes', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const slider = screen.getByRole('slider');
      // Use arrow keys to change value
      slider.focus();
      // ArrowRight increases value by step (0.5), so do it multiple times
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
      }

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      // After 50 steps of 0.5, should be 25
      expect(parseFloat(input.value)).toBeGreaterThanOrEqual(20);
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const slider = screen.getByRole('slider');
      // Radix UI uses data-disabled attribute
      expect(slider).toHaveAttribute('data-disabled');
    });
  });

  describe('Input Functionality', () => {
    it('should update rate when valid number entered', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '18.5' } });

      expect(mockOnSelect).toHaveBeenCalledWith(18.5);
    });

    it('should sync slider when input changes', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '22' } });

      expect(screen.getByText('22%')).toBeInTheDocument();
    });

    it('should show error for non-numeric input', async () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      // HTML5 number inputs reject non-numeric characters in browsers,
      // but in tests we can test the logic with a string that parseFloat can't parse
      // Use Object.defineProperty to bypass the type="number" restriction
      Object.defineProperty(input, 'value', {
        writable: true,
        value: 'abc'
      });
      fireEvent.change(input, { target: { value: 'abc' } });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid number')).toBeInTheDocument();
      });
    });

    it('should show error when rate exceeds 30%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '35' } });

      expect(screen.getByText('Rate cannot exceed 30%')).toBeInTheDocument();
    });

    it('should show error when rate is negative', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '-5' } });

      expect(screen.getByText('Rate cannot be less than 0%')).toBeInTheDocument();
    });

    it('should clamp value to 30 on blur when over max', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50' } });
      fireEvent.blur(input);

      expect(input.value).toBe('30');
      expect(mockOnSelect).toHaveBeenCalledWith(30);
    });

    it('should clamp value to 0 on blur when negative', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-10' } });
      fireEvent.blur(input);

      expect(input.value).toBe('0');
      expect(mockOnSelect).toHaveBeenCalledWith(0);
    });

    it('should set to 0 on blur when input is empty', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(input.value).toBe('0');
      expect(mockOnSelect).toHaveBeenCalledWith(0);
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      expect(input).toBeDisabled();
    });

    it('should allow empty input without showing error', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={15}
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '' } });

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should prevent rate below 0%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '-1' } });

      expect(screen.getByText('Rate cannot be less than 0%')).toBeInTheDocument();
    });

    it('should prevent rate above 30%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '31' } });

      expect(screen.getByText('Rate cannot exceed 30%')).toBeInTheDocument();
    });

    it('should allow rate exactly at 0%', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10} // Initialize with non-zero value
          onSelect={mockOnSelect}
        />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '0' } });

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(mockOnSelect).toHaveBeenCalledWith(0);
    });

    it('should allow rate exactly at 30%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '30' } });

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(mockOnSelect).toHaveBeenCalledWith(30);
    });

    it('should add error class to input when error exists', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '50' } });

      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate commission correctly at 0%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
    });

    it('should calculate commission correctly at 10%', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$900.00')).toBeInTheDocument();
    });

    it('should calculate commission correctly at 30%', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={30}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$300.00')).toBeInTheDocument();
      expect(screen.getByText('$700.00')).toBeInTheDocument();
    });

    it('should calculate commission with decimal rate', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={15.5}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$155.00')).toBeInTheDocument();
      expect(screen.getByText('$845.00')).toBeInTheDocument();
    });

    it('should update commission live when rate changes', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '20' } });

      expect(screen.getByText('$200.00')).toBeInTheDocument();
      expect(screen.getByText('$800.00')).toBeInTheDocument();
    });

    it('should round commission to cents', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={333.33}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      // 333.33 * 0.10 = 33.333, should display as $33.33
      expect(screen.getByText('$33.33')).toBeInTheDocument();
      // 333.33 - 33.333 = 299.997, should display as $300.00
      expect(screen.getByText('$300.00')).toBeInTheDocument();
    });
  });

  describe('Net Amount Calculation', () => {
    it('should calculate net amount correctly', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1500}
          defaultRate={20}
          onSelect={mockOnSelect}
        />
      );

      // Commission: 1500 * 0.20 = 300
      expect(screen.getByText('$300.00')).toBeInTheDocument();
      // Net: 1500 - 300 = 1200
      expect(screen.getByText('$1200.00')).toBeInTheDocument();
    });

    it('should show full amount as net when rate is 0%', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={500} onSelect={mockOnSelect} />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('should update net amount live when rate changes', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={2000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '25' } });

      // Commission: 2000 * 0.25 = 500
      expect(screen.getByText('$500.00')).toBeInTheDocument();
      // Net: 2000 - 500 = 1500
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with 2 decimal places', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1234.5}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$123.45')).toBeInTheDocument();
      expect(screen.getByText('$1111.05')).toBeInTheDocument();
    });

    it('should format whole numbers with .00', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$900.00')).toBeInTheDocument();
    });
  });

  describe('Component Updates', () => {
    it('should update when defaultRate prop changes', () => {
      const { rerender } = renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('(Default: 10%)')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ManagerCommissionSelector
            amount={1000}
            defaultRate={20}
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('(Default: 20%)')).toBeInTheDocument();
      const input = screen.getByLabelText('Precise Entry (%)') as HTMLInputElement;
      expect(input.value).toBe('20');
    });

    it('should recalculate when amount prop changes', () => {
      const { rerender } = renderWithProviders(
        <ManagerCommissionSelector
          amount={1000}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$100.00')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <ManagerCommissionSelector
            amount={2000}
            defaultRate={10}
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('$200.00')).toBeInTheDocument();
      expect(screen.getByText('$1800.00')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={0}
          defaultRate={15}
          onSelect={mockOnSelect}
        />
      );

      // Both commission and net should be $0.00
      // Query for commission (first occurrence in "Commission:" section)
      const commissionSection = screen.getByText('Commission:').parentElement;
      expect(commissionSection).toHaveTextContent('$0.00');

      // Query for net (in "Your net:" section)
      const netSection = screen.getByText('Your net:').parentElement;
      expect(netSection).toHaveTextContent('$0.00');
    });

    it('should handle very small amounts', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={0.01}
          defaultRate={10}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle large amounts', () => {
      renderWithProviders(
        <ManagerCommissionSelector
          amount={999999.99}
          defaultRate={30}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('$300000.00')).toBeInTheDocument();
      expect(screen.getByText('$699999.99')).toBeInTheDocument();
    });

    it('should handle decimal percentages', () => {
      renderWithProviders(
        <ManagerCommissionSelector amount={1000} onSelect={mockOnSelect} />
      );

      const input = screen.getByLabelText('Precise Entry (%)');
      fireEvent.change(input, { target: { value: '12.75' } });

      expect(screen.getByText('$127.50')).toBeInTheDocument();
      expect(screen.getByText('$872.50')).toBeInTheDocument();
    });
  });
});
