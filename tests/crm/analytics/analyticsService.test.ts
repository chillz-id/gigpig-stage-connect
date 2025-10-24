const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('crmAnalyticsService', () => {
  const { crmAnalyticsService } = require('@/services/crm/analytics-service');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-10-01T00:00:00Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildYearsAgo = (months: number) => {
    const d = new Date('2024-10-01T00:00:00Z');
    d.setMonth(d.getMonth() - months);
    return d.toISOString();
  };

  it('aggregates analytics data returned from Supabase', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: jest.fn(() => ({
            not: jest.fn(() => ({
              data: [
                { customer_segment: 'VIP' },
                { customer_segment: 'General' },
                { customer_segment: 'VIP' },
              ],
              error: null,
            })),
          })),
        };
      }

      if (table === 'invoices') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              gte: jest.fn(() => ({
                data: [
                  { issued_date: buildYearsAgo(1), total_amount: 400 },
                  { issued_date: buildYearsAgo(2), total_amount: 200 },
                ],
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'deal_negotiations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn(() => ({
              data: [
                { status: 'proposed', proposed_fee: 500 },
                { status: 'accepted', proposed_fee: 800 },
                { status: 'declined', proposed_fee: 100 },
              ],
              error: null,
            })),
          })),
        };
      }

      if (table === 'tasks') {
        return {
          select: jest.fn(() => ({
            gte: jest.fn(() => ({
              data: [
                { status: 'pending', due_date: '2024-10-03' },
                { status: 'pending', due_date: '2024-09-20' },
                { status: 'completed', due_date: '2024-09-18' },
              ],
              error: null,
            })),
          })),
        };
      }

      return { select: jest.fn() };
    });

    const analytics = await crmAnalyticsService.getAnalytics();

    expect(analytics.segments).toEqual(
      expect.arrayContaining([
        { segment: 'VIP', count: 2 },
        { segment: 'General', count: 1 },
      ])
    );
    expect(analytics.pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: 'proposed', count: 1, value: 500 }),
        expect.objectContaining({ stage: 'accepted', count: 1, value: 800 }),
      ])
    );
    expect(analytics.engagement).toMatchObject({
      activeCustomers: 3,
      tasksDueThisWeek: 1,
      overdueFollowUps: 1,
    });
  });

  it('propagates Supabase errors', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: jest.fn(() => ({
            not: jest.fn(() => ({ data: null, error: new Error('segment error') })),
          })),
        };
      }

      // Provide safe fallbacks for other tables to avoid undefined property errors
      if (table === 'invoices') {
        return {
          select: jest.fn(() => ({ in: jest.fn(() => ({ gte: jest.fn(() => ({ data: [], error: null })) })) })),
        };
      }
      if (table === 'deal_negotiations') {
        return { select: jest.fn(() => ({ in: jest.fn(() => ({ data: [], error: null })) })) };
      }
      if (table === 'tasks') {
        return { select: jest.fn(() => ({ gte: jest.fn(() => ({ data: [], error: null })) })) };
      }

      return { select: jest.fn() };
    });

    await expect(crmAnalyticsService.getAnalytics()).rejects.toThrow('segment error');
  });
});
