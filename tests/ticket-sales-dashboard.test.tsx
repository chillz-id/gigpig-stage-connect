import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { TicketSalesDashboard } from '@/components/ticket-sales';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                event_id: 'event-1',
                customer_name: 'John Doe',
                customer_email: 'john@example.com',
                ticket_quantity: 2,
                ticket_type: 'General Admission',
                total_amount: 50,
                platform: 'humanitix',
                platform_order_id: 'HX123',
                refund_status: 'none',
                purchase_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                events: {
                  name: 'Comedy Night',
                  capacity: 100
                }
              },
              {
                id: '2',
                event_id: 'event-1',
                customer_name: 'Jane Smith',
                customer_email: 'jane@example.com',
                ticket_quantity: 3,
                ticket_type: 'VIP',
                total_amount: 150,
                platform: 'eventbrite',
                platform_order_id: 'EB456',
                refund_status: 'none',
                purchase_date: new Date(Date.now() - 86400000).toISOString(),
                created_at: new Date(Date.now() - 86400000).toISOString(),
                events: {
                  name: 'Comedy Night',
                  capacity: 100
                }
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock the ticket sync service
jest.mock('@/services/ticketSyncService', () => ({
  ticketSyncService: {
    syncAllPlatforms: jest.fn(() => Promise.resolve([
      { success: true, platform: 'humanitix', ticketsSold: 10, grossRevenue: 500 },
      { success: true, platform: 'eventbrite', ticketsSold: 15, grossRevenue: 750 }
    ]))
  }
}));

// Mock chart components to avoid canvas errors
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ComposedChart: ({ children }: any) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('TicketSalesDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with loading state initially', () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders metrics after data loads', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Event Analytics')).toBeInTheDocument();
    });

    // Check if key metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
      expect(screen.getByText('Average Price')).toBeInTheDocument();
      expect(screen.getByText('Sales Velocity')).toBeInTheDocument();
    });
  });

  test('renders platform breakdown', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Platform Breakdown')).toBeInTheDocument();
    });
  });

  test('renders time range selector', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
    });
  });

  test('renders export buttons', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });

  test('handles multi-event mode', async () => {
    renderWithProviders(<TicketSalesDashboard multiEvent={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    });
  });

  test('renders refresh button', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  test('displays last updated time', async () => {
    renderWithProviders(<TicketSalesDashboard eventId="event-1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });
});