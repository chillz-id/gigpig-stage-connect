import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddGigDialog } from '@/components/comedian/AddGigDialog';

// Mock hooks before imports
const mockCreateGig = jest.fn();
const mockUseMyGigs = jest.fn(() => ({
  createGig: mockCreateGig,
  isCreating: false,
  manualGigs: [],
  isLoading: false,
  deleteGig: jest.fn(),
  isDeleting: false
}));

const mockUseAuth = jest.fn(() => ({
  user: { id: 'user-123' },
  loading: false
}));

jest.mock('@/hooks/useMyGigs', () => ({
  useMyGigs: () => mockUseMyGigs()
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn()
  })
}));

describe('AddGigDialog', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateGig.mockClear();
  });

  it('should render all form fields', () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venue address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date & time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date & time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('should show validation error when title is empty', async () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    const submitButton = screen.getByRole('button', { name: /add gig/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(mockCreateGig).not.toHaveBeenCalled();
  });

  it('should show validation error when start date is empty', async () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Gig' } });

    const submitButton = screen.getByRole('button', { name: /add gig/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/start date and time is required/i)).toBeInTheDocument();
    });

    expect(mockCreateGig).not.toHaveBeenCalled();
  });

  it('should call createGig with correct data on submit', async () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Comedy Night' }
    });
    fireEvent.change(screen.getByLabelText(/start date & time/i), {
      target: { value: '2025-11-20T19:00' }
    });

    // Fill in optional fields
    fireEvent.change(screen.getByLabelText(/venue name/i), {
      target: { value: 'The Comedy Store' }
    });
    fireEvent.change(screen.getByLabelText(/venue address/i), {
      target: { value: '1 Comedy Lane' }
    });
    fireEvent.change(screen.getByLabelText(/end date & time/i), {
      target: { value: '2025-11-20T21:00' }
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Bring mic' }
    });

    const submitButton = screen.getByRole('button', { name: /add gig/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGig).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Comedy Night',
        venue_name: 'The Comedy Store',
        venue_address: '1 Comedy Lane',
        start_datetime: '2025-11-20T19:00',
        end_datetime: '2025-11-20T21:00',
        notes: 'Bring mic'
      });
    });
  });

  it('should handle null values for optional fields', async () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Fill in only required fields
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Gig' }
    });
    fireEvent.change(screen.getByLabelText(/start date & time/i), {
      target: { value: '2025-11-20T19:00' }
    });

    const submitButton = screen.getByRole('button', { name: /add gig/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateGig).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Test Gig',
        venue_name: null,
        venue_address: null,
        start_datetime: '2025-11-20T19:00',
        end_datetime: null,
        notes: null
      });
    });
  });

  it('should close dialog after successful submission', async () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Gig' }
    });
    fireEvent.change(screen.getByLabelText(/start date & time/i), {
      target: { value: '2025-11-20T19:00' }
    });

    const submitButton = screen.getByRole('button', { name: /add gig/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should disable form fields when creating', () => {
    mockUseMyGigs.mockReturnValueOnce({
      createGig: mockCreateGig,
      isCreating: true,
      manualGigs: [],
      isLoading: false,
      deleteGig: jest.fn(),
      isDeleting: false
    });

    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByLabelText(/title/i)).toBeDisabled();
    expect(screen.getByLabelText(/venue name/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
  });

  it('should close dialog when cancel button is clicked', () => {
    render(<AddGigDialog open={true} onOpenChange={mockOnOpenChange} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
