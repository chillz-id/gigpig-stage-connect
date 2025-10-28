import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealTermsConfigurator } from '@/components/event-management/DealTermsConfigurator';
import * as GSTCalculator from '@/utils/gst-calculator';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Mock GST calculator
jest.mock('@/utils/gst-calculator');

const mockCalculateGST = GSTCalculator.calculateGST as jest.MockedFunction<
  typeof GSTCalculator.calculateGST
>;

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('DealTermsConfigurator', () => {
  const mockOnConfigure = jest.fn();
  const defaultGstMode: GSTCalculator.GSTMode = 'inclusive';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateGST.mockReturnValue({
      gross: 1000,
      tax: 90.91,
      net: 909.09,
    });
  });

  it('should render all form fields', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    expect(screen.getByLabelText(/deal type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/split type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gst treatment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add participant with these terms/i })).toBeInTheDocument();
  });

  it('should toggle between dollar and percent input', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);
    const toggleButton = screen.getByRole('button', { name: /switch to/i });

    // Start in percent mode (default)
    expect(amountInput).toHaveAttribute('placeholder', '50');

    // Toggle to dollar
    fireEvent.click(toggleButton);
    expect(amountInput).toHaveAttribute('placeholder', '1000');

    // Toggle back to percent
    fireEvent.click(toggleButton);
    expect(amountInput).toHaveAttribute('placeholder', '50');
  });

  it('should calculate GST preview for dollar amounts', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);
    const toggleButton = screen.getByRole('button', { name: /switch to/i });

    // Toggle to dollar mode
    fireEvent.click(toggleButton);

    // Enter amount
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // GST preview should appear
    expect(screen.getByText(/payment breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument(); // Gross
    expect(screen.getByText('$90.91')).toBeInTheDocument(); // Tax
    expect(screen.getByText('$909.09')).toBeInTheDocument(); // Net
  });

  it('should not show GST preview for percentages', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);

    // Enter percentage amount
    fireEvent.change(amountInput, { target: { value: '50' } });

    // GST preview should NOT appear for percentages
    expect(screen.queryByText(/payment breakdown/i)).not.toBeInTheDocument();
  });

  it('should support all 5 deal types', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const dealTypeSelect = screen.getByLabelText(/deal type/i);
    fireEvent.click(dealTypeSelect);

    const dealTypes = ['Ticket Sales', 'Door Sales', 'Merch Sales', 'Venue Hire', 'Custom'];
    dealTypes.forEach((type) => {
      expect(screen.getByRole('option', { name: type })).toBeInTheDocument();
    });
  });

  it('should show custom name field only for custom type', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    // Custom name should not be visible initially
    expect(screen.queryByLabelText(/custom deal name/i)).not.toBeInTheDocument();

    const dealTypeSelect = screen.getByLabelText(/deal type/i);
    fireEvent.click(dealTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: /custom/i }));

    // Custom name field should now be visible
    expect(screen.getByLabelText(/custom deal name/i)).toBeInTheDocument();
  });

  it('should call onConfigure with correct values (dollar mode)', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);
    const toggleButton = screen.getByRole('button', { name: /switch to/i });
    const configureButton = screen.getByRole('button', { name: /add participant/i });

    // Toggle to dollar mode
    fireEvent.click(toggleButton);

    // Fill in amount
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Submit
    fireEvent.click(configureButton);

    expect(mockOnConfigure).toHaveBeenCalledWith({
      dealType: 'ticket_sales',
      splitType: 'percentage',
      amount: 1000,
      amountType: 'dollar',
      gstMode: 'inclusive',
    });
  });

  it('should call onConfigure with correct values (percent mode)', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);
    const configureButton = screen.getByRole('button', { name: /add participant/i });

    // Enter percentage amount
    fireEvent.change(amountInput, { target: { value: '50' } });

    // Submit
    fireEvent.click(configureButton);

    expect(mockOnConfigure).toHaveBeenCalledWith({
      dealType: 'ticket_sales',
      splitType: 'percentage',
      amount: 50,
      amountType: 'percent',
      gstMode: 'inclusive',
    });
  });

  it('should include custom deal name when custom type selected', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const dealTypeSelect = screen.getByLabelText(/deal type/i);
    const amountInput = screen.getByLabelText(/^amount$/i);
    const configureButton = screen.getByRole('button', { name: /add participant/i });

    // Select custom type
    fireEvent.click(dealTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: /custom/i }));

    // Enter custom name
    const customNameInput = screen.getByLabelText(/custom deal name/i);
    fireEvent.change(customNameInput, { target: { value: 'Special Deal' } });

    // Enter amount
    fireEvent.change(amountInput, { target: { value: '50' } });

    // Submit
    fireEvent.click(configureButton);

    expect(mockOnConfigure).toHaveBeenCalledWith({
      dealType: 'custom',
      customDealName: 'Special Deal',
      splitType: 'percentage',
      amount: 50,
      amountType: 'percent',
      gstMode: 'inclusive',
    });
  });

  it('should update GST preview when GST mode changes', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode="inclusive" onConfigure={mockOnConfigure} />
    );

    const amountInput = screen.getByLabelText(/^amount$/i);
    const toggleButton = screen.getByRole('button', { name: /switch to/i });
    const gstModeSelect = screen.getByLabelText(/gst treatment/i);

    // Toggle to dollar mode
    fireEvent.click(toggleButton);

    // Enter amount
    fireEvent.change(amountInput, { target: { value: '1000' } });

    // Initially in inclusive mode
    expect(screen.getByText(/based on inclusive gst treatment/i)).toBeInTheDocument();

    // Change to exclusive
    mockCalculateGST.mockReturnValue({
      gross: 1100,
      tax: 100,
      net: 1000,
    });

    fireEvent.click(gstModeSelect);
    fireEvent.click(screen.getByRole('option', { name: /gst exclusive/i }));

    // Wait for re-render with new calculation
    waitFor(() => {
      expect(screen.getByText(/based on exclusive gst treatment/i)).toBeInTheDocument();
      expect(screen.getByText('$1100.00')).toBeInTheDocument(); // New gross
      expect(screen.getByText('$100.00')).toBeInTheDocument(); // New tax
    });
  });

  it('should handle all split types', () => {
    renderWithProviders(
      <DealTermsConfigurator defaultGstMode={defaultGstMode} onConfigure={mockOnConfigure} />
    );

    const splitTypeSelect = screen.getByLabelText(/split type/i);
    fireEvent.click(splitTypeSelect);

    const splitTypes = ['Percentage', 'Flat Fee', 'Door Split', 'Guaranteed Minimum'];
    splitTypes.forEach((type) => {
      expect(screen.getByRole('option', { name: type })).toBeInTheDocument();
    });
  });
});
