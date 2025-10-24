const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('applicationService', () => {
  const { applicationService } = require('@/services/crm/application-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns applications for promoter events', async () => {
    const eventsBuilder: any = {
      select: jest.fn(() => ({ or: jest.fn(() => ({ data: [{ id: 'event-1' }], error: null })) })),
    };

    const applicationsBuilder: any = {
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [
              {
                id: 'app-1',
                event_id: 'event-1',
                comedian_id: 'comedian-1',
                status: 'pending',
                events: { title: 'Event', event_date: '2025-01-01' },
                profiles: { name: 'Comedian' },
              },
            ],
            error: null,
          })),
        })),
      })),
    };

    fromMock.mockImplementationOnce(() => eventsBuilder);
    fromMock.mockImplementationOnce(() => applicationsBuilder);

    const results = await applicationService.listForPromoter('user-1');

    expect(results).toHaveLength(1);
    expect(results[0].event?.title).toBe('Event');
  });

  it('propagates errors from Supabase', async () => {
    const failure = new Error('events failed');
    const eventsBuilder: any = {
      select: jest.fn(() => ({ or: jest.fn(() => ({ data: null, error: failure })) })),
    };
    fromMock.mockImplementationOnce(() => eventsBuilder);

    await expect(applicationService.listForPromoter('user-1')).rejects.toThrow('events failed');

    const applicationsBuilder: any = {
      select: jest.fn(() => ({
        in: jest.fn(() => ({ order: jest.fn(() => ({ data: null, error: new Error('list failed') })) })),
      })),
    };

    fromMock.mockImplementationOnce(() => ({ select: jest.fn(() => ({ or: jest.fn(() => ({ data: [{ id: 'event-1' }], error: null })) })) }));
    fromMock.mockImplementationOnce(() => applicationsBuilder);

    await expect(applicationService.listForPromoter('user-1')).rejects.toThrow('list failed');

    const statusBuilder: any = {
      update: jest.fn(() => ({ eq: jest.fn(() => ({ error: new Error('update failed') })) })),
    };
    fromMock.mockImplementation(() => statusBuilder);

    await expect(applicationService.updateStatus('app-1', 'accepted')).rejects.toThrow('update failed');
  });
});
