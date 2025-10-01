import React, { PropsWithChildren } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useTourPlanningWorkspace } from '@/components/tours/workspace/useTourPlanningWorkspace';
import type { Tour, TourStop, TourStatistics, TourLogistics } from '@/types/tour';

// Mocks --------------------------------------------------------------------
const toastMock = jest.fn();
const getTourStops = jest.fn();
const getTourLogistics = jest.fn();
const getTourStatistics = jest.fn();
const createTourStopMock = jest.fn();
const updateTourStopMock = jest.fn();
const deleteTourStopMock = jest.fn();
const bulkUpdateTourStopsMock = jest.fn();

jest.mock('@/hooks/use-toast', () => ({
  toast: (args: any) => toastMock(args)
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn((opts: any) => {
      if (opts.queryKey[0] === 'tour-stops') {
        return {
          data: getTourStops(),
          isLoading: false,
          refetch: jest.fn()
        };
      }
      if (opts.queryKey[0] === 'tour-logistics') {
        return {
          data: getTourLogistics(),
          isLoading: false
        };
      }
      if (opts.queryKey[0] === 'tour-statistics') {
        return {
          data: getTourStatistics(),
          isLoading: false
        };
      }
      return actual.useQuery(opts);
    }),
    useMutation: jest.fn((opts: any) => {
      const mutate = jest.fn((variables: any) => opts.onSuccess?.(variables));
      mutate.mockImplementation((variables: any) => opts.mutationFn(variables));
      return {
        mutate,
        isPending: false
      };
    })
  };
});

jest.mock('@/services/tourService', () => ({
  tourService: {
    getTourStops: () => getTourStops(),
    getTourLogistics: () => getTourLogistics(),
    getTourStatistics: () => getTourStatistics(),
    createTourStop: (...args: any[]) => createTourStopMock(...args),
    updateTourStop: (...args: any[]) => updateTourStopMock(...args),
    deleteTourStop: (...args: any[]) => deleteTourStopMock(...args),
    bulkUpdateTourStops: (...args: any[]) => bulkUpdateTourStopsMock(...args)
  }
}));

function renderHookWithProviders<T>(
  callback: () => T,
  Wrapper: React.ComponentType<PropsWithChildren> = ({ children }) => <>{children}</>
) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const result: { current?: T } = {};

  function TestComponent() {
    result.current = callback();
    return null;
  }

  act(() => {
    root.render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );
  });

  return {
    result: {
      get current() {
        return result.current as T;
      }
    },
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    }
  };
}

function renderUseTourWorkspace(tour: Tour, isEditable = true) {
  const queryClient = new QueryClient();
  return renderHookWithProviders(
    () => useTourPlanningWorkspace(tour, isEditable),
    ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useTourPlanningWorkspace', () => {
  const baseTour: Tour = {
    id: 'tour-1',
    name: 'Test Tour',
    description: 'Tour description',
    tour_manager_id: 'manager-1',
    status: 'planning',
    tour_type: 'standard',
    actual_revenue: 0,
    currency: 'AUD',
    revenue_sharing: {},
    marketing_materials: {},
    emergency_contact: {},
    tour_requirements: {},
    travel_policy: {},
    insurance_info: {},
    is_public: false,
    total_capacity: 0,
    tickets_sold: 0,
    gross_sales: 0,
    created_at: '',
    updated_at: ''
  };

  const stops: TourStop[] = [
    {
      id: 'stop-1',
      tour_id: 'tour-1',
      order_index: 1,
      venue_name: 'Venue A',
      venue_city: 'Sydney',
      venue_state: 'NSW',
      venue_country: 'Australia',
      venue_address: '',
      venue_capacity: 500,
      venue_contact: {},
      event_date: '2025-01-02',
      show_time: '20:00',
      status: 'planned',
      tickets_sold: 200,
      revenue: 5000,
      expenses: 2000,
      ticket_price: 25,
      show_duration_minutes: 120,
      technical_requirements: {},
      catering_requirements: {},
      accommodation_info: {},
      local_contacts: {},
      travel_time_to_next: 60,
      distance_to_next_km: 80,
      created_at: '',
      updated_at: ''
    },
    {
      id: 'stop-2',
      tour_id: 'tour-1',
      order_index: 2,
      venue_name: 'Venue B',
      venue_city: 'Melbourne',
      venue_state: 'VIC',
      venue_country: 'Australia',
      venue_address: '',
      venue_capacity: 600,
      venue_contact: {},
      event_date: '2025-01-05',
      show_time: '21:00',
      status: 'planned',
      tickets_sold: 400,
      revenue: 8000,
      expenses: 3000,
      ticket_price: 35,
      show_duration_minutes: 120,
      technical_requirements: {},
      catering_requirements: {},
      accommodation_info: {},
      local_contacts: {},
      created_at: '',
      updated_at: ''
    }
  ];

  beforeEach(() => {
    getTourStops.mockReturnValue(stops);
    getTourLogistics.mockReturnValue([] as TourLogistics[]);

    const statistics: TourStatistics = {
      total_stops: 2,
      total_capacity: 1100,
      tickets_sold: 600,
      occupancy_rate: 54.5,
      total_revenue: 13000,
      total_expenses: 5000,
      net_profit: 8000,
      profit_margin: 61.5
    };
    getTourStatistics.mockReturnValue(statistics);

    createTourStopMock.mockResolvedValue({});
    updateTourStopMock.mockResolvedValue({});
    deleteTourStopMock.mockResolvedValue({});
    bulkUpdateTourStopsMock.mockResolvedValue({});
  });

  it('returns sorted stops', () => {
    const { result } = renderUseTourWorkspace(baseTour);
    expect(result.current.sortedStops.length).toBe(2);
    expect(result.current.sortedStops[0]?.order_index).toBe(1);
    expect(result.current.sortedStops[1]?.order_index).toBe(2);
  });

  it('toggles drag mode', () => {
    const { result } = renderUseTourWorkspace(baseTour);

    expect(result.current.dragEnabled).toBe(false);
    act(() => {
      result.current.toggleDrag();
    });
    expect(result.current.dragEnabled).toBe(true);
  });

  it('handles drag end updates', () => {
    const { result } = renderUseTourWorkspace(baseTour);

    act(() => {
      result.current.handleDragEnd({
        source: { index: 0, droppableId: 'tour-stops' },
        destination: { index: 1, droppableId: 'tour-stops' }
      } as any);
    });

    expect(bulkUpdateTourStopsMock).toHaveBeenCalledWith([
      { id: 'stop-2', data: { order_index: 1 } },
      { id: 'stop-1', data: { order_index: 2 } }
    ]);
  });

  it('opens and closes stop details', () => {
    const { result } = renderUseTourWorkspace(baseTour);

    act(() => {
      result.current.openStopDetails(stops[0]!);
    });

    expect(result.current.showStopDetailsModal).toBe(true);

    act(() => {
      result.current.closeStopDetails();
    });

    expect(result.current.showStopDetailsModal).toBe(false);
  });

  it('does not reorder when destination missing', () => {
    const { result } = renderUseTourWorkspace(baseTour);

    bulkUpdateTourStopsMock.mockClear();

    act(() => {
      result.current.handleDragEnd({
        source: { index: 0, droppableId: 'tour-stops' },
        destination: null
      } as any);
    });

    expect(bulkUpdateTourStopsMock).not.toHaveBeenCalled();
  });
});
