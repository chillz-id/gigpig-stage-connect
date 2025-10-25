const eventFromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: eventFromMock,
  },
}));

describe('eventService', () => {
  const { eventService } = require('@/services/crm/event-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches upcoming sessions with ordering', async () => {
    const limitMock = jest.fn(() => ({ data: [{ canonical_source: 'humanitix' }], error: null }));
    const queryBuilder: any = {
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: limitMock,
    };
    const selectMock = jest.fn(() => queryBuilder);
    eventFromMock.mockReturnValue({ select: selectMock });

    const sessions = await eventService.listUpcomingSessions(5);

    expect(eventFromMock).toHaveBeenCalledWith('session_financials');
    expect(selectMock).toHaveBeenCalled();
    expect(sessions).toHaveLength(1);
  });

  it('throws when Supabase returns error', async () => {
    const failure = new Error('bad query');
    const queryBuilder: any = {
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(() => ({ data: null, error: failure })),
    };
    const selectMock = jest.fn(() => queryBuilder);
    eventFromMock.mockReturnValue({ select: selectMock });

    await expect(eventService.listUpcomingSessions()).rejects.toThrow('bad query');
  });
});
