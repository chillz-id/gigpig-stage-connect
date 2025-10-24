const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('ticketSalesService', () => {
  const { ticketSalesService } = require('@/services/crm/ticket-sales-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches ticket sales optionally filtered by event', async () => {
    const orderMock = jest.fn(() => ({ data: [{ id: 'sale-1', total_amount: 120 }], error: null }));
    const queryBuilder: any = {
      eq: jest.fn().mockReturnThis(),
      order: orderMock,
    };
    const selectMock = jest.fn(() => queryBuilder);
    fromMock.mockReturnValue({ select: selectMock });

    const results = await ticketSalesService.list('event-1');

    expect(fromMock).toHaveBeenCalledWith('ticket_sales');
    expect(queryBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
    expect(results).toHaveLength(1);
  });

  it('creates ticket sales and propagates errors', async () => {
    const successSingle: any = jest.fn(() => ({ data: { id: 'sale-2' }, error: null }));
    const successSelect: any = jest.fn(() => ({ single: successSingle }));
    const insertMock: any = jest.fn(() => ({ select: successSelect }));
    fromMock.mockReturnValue({ insert: insertMock });

    const created = await ticketSalesService.create({
      event_id: 'event-2',
      customer_name: 'Sam',
      customer_email: 'sam@example.com',
      ticket_quantity: 2,
      ticket_type: 'VIP',
      total_amount: 200,
      platform: 'humanitix',
      refund_status: 'none',
    } as any);

    expect(created).toHaveProperty('id', 'sale-2');

    const failure = new Error('insert failed');
    const failureSingle: any = jest.fn(() => ({ data: null, error: failure }));
    const failureSelect: any = jest.fn(() => ({ single: failureSingle }));
    insertMock.mockReturnValueOnce({ select: failureSelect } as any);

    await expect(ticketSalesService.create({} as any)).rejects.toThrow('insert failed');
  });

  it('updates ticket sales and calculates metrics', async () => {
    const updateBuilder = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn(() => ({ single: jest.fn(() => ({ data: { id: 'sale-3', total_amount: 50 }, error: null })) })),
    } as any;
    const updateMock = jest.fn(() => updateBuilder);
    fromMock.mockReturnValue({ update: updateMock });

    const updated = await ticketSalesService.update('sale-3', { refund_status: 'refunded' });
    expect(updated).toEqual({ id: 'sale-3', total_amount: 50 });

    const metrics = ticketSalesService.calculateMetrics([
      { total_amount: 100, ticket_quantity: 2, platform: 'humanitix' } as any,
      { total_amount: 60, ticket_quantity: 1, platform: 'eventbrite' } as any,
    ]);

    expect(metrics.totalRevenue).toBe(160);
    expect(metrics.platformBreakdown).toEqual({ humanitix: 1, eventbrite: 1 });
  });
});
