const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('gigService', () => {
  const { gigService } = require('@/services/crm/gig-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps upcoming gigs for comedian', async () => {
    const queryBuilder: any = {
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn(() => ({
        data: [
          {
            id: 'app-1',
            event_id: 'evt-1',
            status: 'accepted',
            events: { title: 'Show Night', venue: 'Main Venue', event_date: '2024-11-01', pay_per_comedian: 250 },
          },
        ],
        error: null,
      })),
    };
    const selectMock = jest.fn(() => queryBuilder);
    fromMock.mockReturnValue({ select: selectMock });

    const gigs = await gigService.listUpcomingForComedian('comedian-1');

    expect(fromMock).toHaveBeenCalledWith('applications');
    expect(gigs[0]).toMatchObject({ title: 'Show Night', venue: 'Main Venue', payment_amount: 250 });
  });

  it('bubbles Supabase errors', async () => {
    const failure = new Error('fetch failed');
    const queryBuilder: any = {
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn(() => ({ data: null, error: failure })),
    };
    const selectMock = jest.fn(() => queryBuilder);
    fromMock.mockReturnValue({ select: selectMock });

    await expect(gigService.listUpcomingForComedian('comedian-1')).rejects.toThrow('fetch failed');
  });
});
