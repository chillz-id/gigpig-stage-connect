import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealParticipantSelector } from '@/components/event-management/DealParticipantSelector';
import { supabase } from '@/integrations/supabase/client';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Test wrapper with ThemeProvider
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper to render with wrapper
const renderWithProviders = (ui: ReactNode) => render(<TestWrapper>{ui}</TestWrapper>);

describe('DealParticipantSelector', () => {
  const mockOnAddParticipant = jest.fn();
  const existingParticipants: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render email input and lookup button', () => {
    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    expect(screen.getByLabelText(/partner email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /look up/i })).toBeInTheDocument();
  });

  it('should lookup profile by email when button clicked', async () => {
    const mockProfile = {
      id: 'profile-123',
      name: 'Test Comedian',
      email: 'test@example.com',
      gst_registered: true,
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    const lookupButton = screen.getByRole('button', { name: /look up/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(lookupButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    await waitFor(() => {
      expect(screen.getByText('Test Comedian')).toBeInTheDocument();
    });
  });

  it('should display found profile with GST status badge', async () => {
    const mockProfile = {
      id: 'profile-123',
      name: 'Test Comedian',
      email: 'test@example.com',
      avatar_url: null,
      gst_registered: true,
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Comedian')).toBeInTheDocument();
      expect(screen.getByText('GST Registered')).toBeInTheDocument();
    });
  });

  it('should show invitation option if no profile found', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'notfound@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      expect(screen.getByText(/no profile found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /invite partner/i })).toBeInTheDocument();
    });
  });

  it('should call onAddParticipant when adding found profile', async () => {
    const mockProfile = {
      id: 'profile-123',
      name: 'Test Comedian',
      email: 'test@example.com',
      gst_registered: true,
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Comedian')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add to deal/i }));

    expect(mockOnAddParticipant).toHaveBeenCalledWith({
      participant_id: 'profile-123',
      participant_email: 'test@example.com',
      participant_name: 'Test Comedian',
      gst_registered: true,
      invitation_pending: false,
    });
  });

  it('should call onAddParticipant when inviting partner (no profile)', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'newpartner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite partner/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /invite partner/i }));

    expect(mockOnAddParticipant).toHaveBeenCalledWith({
      participant_email: 'newpartner@example.com',
      participant_name: 'newpartner@example.com',
      gst_registered: false,
      invitation_pending: true,
    });
  });

  it('should disable "Add to Deal" if participant already added', async () => {
    const mockProfile = {
      id: 'profile-123',
      name: 'Test Comedian',
      email: 'test@example.com',
      gst_registered: true,
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={['test@example.com']}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /already added/i });
      expect(addButton).toBeDisabled();
    });
  });

  it('should reset state after adding participant', async () => {
    const mockProfile = {
      id: 'profile-123',
      name: 'Test Comedian',
      email: 'test@example.com',
      gst_registered: true,
    };

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    renderWithProviders(
      <DealParticipantSelector
        onAddParticipant={mockOnAddParticipant}
        existingParticipants={existingParticipants}
      />
    );

    const emailInput = screen.getByLabelText(/partner email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Comedian')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add to deal/i }));

    // Input should be cleared
    expect(emailInput).toHaveValue('');
    // Profile alert should be gone
    expect(screen.queryByText('Test Comedian')).not.toBeInTheDocument();
  });
});
