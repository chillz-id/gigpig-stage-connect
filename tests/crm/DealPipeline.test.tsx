import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DealPipelinePage from '@/pages/DealPipelinePage';
import { Deal } from '@/hooks/useDeals';

// Mock the hooks
vi.mock('@/hooks/useDeals', () => ({
  useDeals: vi.fn(),
  useUpdateDealStatus: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Test Deal 1',
    deal_type: 'booking',
    status: 'proposed',
    artist_id: 'artist-1',
    promoter_id: 'promoter-1',
    proposed_fee: 500,
    performance_date: '2025-12-01',
    created_at: '2025-10-13',
    artist: {
      id: 'artist-1',
      stage_name: 'Test Comedian',
      first_name: 'Test',
      last_name: 'Comedian',
    },
    promoter: {
      id: 'promoter-1',
      first_name: 'Test',
      last_name: 'Promoter',
    },
  },
  {
    id: '2',
    title: 'Test Deal 2',
    deal_type: 'performance',
    status: 'negotiating',
    artist_id: 'artist-2',
    promoter_id: 'promoter-2',
    proposed_fee: 750,
    performance_date: '2025-12-15',
    deadline: '2025-11-30',
    created_at: '2025-10-10',
    artist: {
      id: 'artist-2',
      stage_name: 'Another Comedian',
      first_name: 'Another',
      last_name: 'Comedian',
    },
  },
];

describe('DealPipelinePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DealPipelinePage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders the deal pipeline page header', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Deal Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/Manage and track comedy show bookings/i)).toBeInTheDocument();
  });

  it('displays pipeline metrics', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
    });

    renderComponent();

    // Total pipeline value should be $500 + $750 = $1,250
    expect(screen.getByText('$1,250')).toBeInTheDocument();

    // Active deals should be 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows loading spinner when data is loading', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderComponent();

    // Loading spinner should be visible
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load deals'),
    });

    renderComponent();

    expect(screen.getByText(/Error loading deals/i)).toBeInTheDocument();
  });

  it('renders the New Deal button', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByRole('button', { name: /New Deal/i })).toBeInTheDocument();
  });

  it('renders filter components', () => {
    const { useDeals } = require('@/hooks/useDeals');
    useDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
    });

    renderComponent();

    // Search input should be present
    expect(screen.getByPlaceholderText(/Search deals/i)).toBeInTheDocument();
  });
});
