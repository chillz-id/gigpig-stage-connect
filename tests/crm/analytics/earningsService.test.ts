const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('earningsService', () => {
  const { earningsService } = require('@/services/crm/earnings-service');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-10-01T00:00:00Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildBookingsBuilder = (rows: Record<string, unknown>[], error: Error | null = null) => {
    const builder: any = {
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn(() => ({ data: rows, error })),
    };
    return { select: jest.fn(() => builder) };
  };

  const buildInvoicesBuilder = (rows: Record<string, unknown>[], error: Error | null = null) => {
    const builder: any = {
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn(() => ({ data: rows, error })),
    };
    return { select: jest.fn(() => builder) };
  };

  it('calculates totals and change percentage', async () => {
    const bookingsRows = [
      { fee: 300, events: { title: 'Show A', event_date: '2024-09-15' } },
      { fee: 200, events: { title: 'Show B', event_date: '2024-09-20' } },
    ];
    const invoicesRows = [{ total_amount: 150, issue_date: '2024-09-25' }];

    const previousBookings = [{ fee: 100, events: { title: 'Old Show', event_date: '2024-08-10' } }];
    const previousInvoices = [{ total_amount: 100, issue_date: '2024-08-15' }];

    let bookingCall = 0;
    let invoiceCall = 0;
    fromMock.mockImplementation((table: string) => {
      if (table === 'comedian_bookings') {
        const rows = bookingCall === 0 ? bookingsRows : previousBookings;
        bookingCall += 1;
        return buildBookingsBuilder(rows);
      }
      if (table === 'invoices') {
        const rows = invoiceCall === 0 ? invoicesRows : previousInvoices;
        invoiceCall += 1;
        return buildInvoicesBuilder(rows);
      }
      return buildInvoicesBuilder([]);
    });

    const summary = await earningsService.getEarnings('comedian-1');

    expect(summary.totalEarnings).toBe(650);
    expect(summary.earningsByEvent).toHaveLength(3);
    expect(summary.previousPeriodEarnings).toBeGreaterThan(0);
  });

  it('propagates errors from Supabase', async () => {
    const failure = new Error('earnings failed');
    fromMock.mockImplementation((table: string) => {
      if (table === 'comedian_bookings') {
        return buildBookingsBuilder([], failure);
      }
      if (table === 'invoices') {
        return buildInvoicesBuilder([], failure);
      }
      return buildInvoicesBuilder([], failure);
    });

    await expect(earningsService.getEarnings('comedian-1')).rejects.toThrow('earnings failed');
  });
});
