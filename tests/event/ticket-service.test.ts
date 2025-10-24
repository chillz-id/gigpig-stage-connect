import { ticketService } from '@/services/event/ticket-service';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: jest.fn(),
    },
  };
});

const supabaseFrom = supabase.from as jest.Mock;

describe('ticketService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists tickets for a user and normalises event payloads', async () => {
    const orderMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 't-1',
          user_id: 'user-1',
          event_id: 'event-1',
          ticket_type: 'general',
          quantity: 2,
          total_price: 120,
          status: 'pending',
          payment_status: 'pending',
          created_at: '2024-01-01T00:00:00.000Z',
          events: null,
        },
      ],
      error: null,
    });

    const eqMock = jest.fn(() => ({ order: orderMock }));
    const selectMock = jest.fn(() => ({ eq: eqMock }));

    supabaseFrom.mockReturnValueOnce({ select: selectMock });

    const results = await ticketService.listByUser('user-1');

    expect(supabaseFrom).toHaveBeenCalledWith('tickets');
    expect(selectMock).toHaveBeenCalledWith(expect.stringContaining('events'));
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(results).toEqual([
      expect.objectContaining({
        id: 't-1',
        user_id: 'user-1',
        events: null,
      }),
    ]);
  });

  it('creates a ticket purchase for the given user', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: 't-2',
        user_id: 'user-1',
      },
      error: null,
    });
    const selectMock = jest.fn(() => ({ single: singleMock }));
    const insertMock = jest.fn(() => ({ select: selectMock }));

    supabaseFrom.mockReturnValueOnce({ insert: insertMock });

    const payload = {
      event_id: 'event-1',
      ticket_type: 'vip',
      quantity: 1,
      total_price: 80,
    };

    const created = await ticketService.create('user-1', payload);

    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-1',
      event_id: 'event-1',
      ticket_type: 'vip',
      quantity: 1,
      total_price: 80,
      status: 'pending',
      payment_status: 'pending',
    });
    expect(selectMock).toHaveBeenCalled();
    expect(singleMock).toHaveBeenCalled();
    expect(created).toEqual(expect.objectContaining({ id: 't-2' }));
  });

  it('throws when ticket creation fails', async () => {
    const failingSingle = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('insert failed'),
    });
    const selectMock = jest.fn(() => ({
      single: failingSingle,
    }));
    const insertMock = jest.fn(() => ({ select: selectMock }));

    supabaseFrom.mockReturnValueOnce({ insert: insertMock });

    await expect(
      ticketService.create('user-1', {
        event_id: 'event-1',
        ticket_type: 'vip',
        quantity: 1,
        total_price: 80,
      })
    ).rejects.toThrow('insert failed');
  });

  it('cancels a ticket by id for the given user', async () => {
    const finalEqMock = jest.fn().mockResolvedValue({ error: null });
    const firstEqMock = jest.fn(() => ({ eq: finalEqMock }));
    const updateMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    await ticketService.cancel('ticket-1', 'user-1');

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        payment_status: 'refunded',
      })
    );
    expect(firstEqMock).toHaveBeenCalledWith('id', 'ticket-1');
    expect(finalEqMock).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('propagates errors from ticket cancellation', async () => {
    const cancelError = new Error('cancel failed');
    const finalEqMock = jest.fn().mockResolvedValue({
      error: cancelError,
    });
    const firstEqMock = jest.fn(() => ({ eq: finalEqMock }));
    const updateMock = jest.fn(() => ({ eq: firstEqMock }));

    supabaseFrom.mockReturnValueOnce({ update: updateMock });

    await expect(ticketService.cancel('ticket-2', 'user-2')).rejects.toThrow('cancel failed');
  });
});
