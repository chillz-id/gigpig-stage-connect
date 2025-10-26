const financialFromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: financialFromMock,
  },
}));

describe('financialService', () => {
  const { financialService } = require('@/services/crm/financial-service');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-10-01T00:00:00Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildRangeMock = (rows: Record<string, unknown>[], error: Error | null = null) => ({
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({ data: rows, error })),
      })),
    })),
  });

  it('computes metrics and chart data', async () => {
    const ticketSales = [
      { total_amount: 200, ticket_quantity: 10, purchase_date: '2024-09-30', event_id: 'evt_1' },
      { total_amount: 100, ticket_quantity: 5, purchase_date: '2024-09-29', event_id: 'evt_2' },
    ];
    const comedianBookings = [{ performance_fee: 150 }];
    const venueCosts = [{ amount: 80 }];
    const marketingCosts = [{ amount: 50 }];

    financialFromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'ticket_sales':
          return buildRangeMock(ticketSales);
        case 'comedian_bookings':
          return buildRangeMock(comedianBookings);
        case 'venue_costs':
          return buildRangeMock(venueCosts);
        case 'marketing_costs':
          return buildRangeMock(marketingCosts);
        default:
          return buildRangeMock([]);
      }
    });

    const result = await financialService.getMetrics();

    expect(result.metrics.totalRevenue).toBe(300);
    expect(result.metrics.totalCosts).toBe(280);
    expect(result.metrics.netProfit).toBe(20);
    expect(result.metrics.totalTickets).toBe(15);
    expect(result.metrics.totalEvents).toBe(2);
    expect(result.chartData.costBreakdown).toEqual(
      expect.arrayContaining([
        { category: 'Comedians', amount: 150 },
        { category: 'Venue', amount: 80 },
        { category: 'Marketing', amount: 50 },
      ])
    );
  });

  it('propagates Supabase errors', async () => {
    const failure = new Error('fetch failed');
    financialFromMock.mockImplementation(() => buildRangeMock([], failure));

    await expect(financialService.getMetrics()).rejects.toThrow('fetch failed');
  });
});
