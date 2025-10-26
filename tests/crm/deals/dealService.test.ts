const dealSelectMock = jest.fn();
const dealFromMock = jest.fn(() => ({
  select: dealSelectMock,
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: dealFromMock,
  },
}));

describe('dealService.getStats', () => {
  // Import lazily after mocks so the service captures the mocked client
  const { dealService } = require('@/services/crm/deal-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates counts and monetary totals by status', async () => {
    dealSelectMock.mockResolvedValue({
      data: [
        { status: 'proposed', proposed_fee: 50 },
        { status: 'accepted', proposed_fee: 125 },
        { status: 'accepted', proposed_fee: 200 },
        { status: 'declined', proposed_fee: null },
      ],
      error: null,
    });

    const stats = await dealService.getStats();

    expect(dealFromMock).toHaveBeenCalledWith('deal_negotiations');
    expect(dealSelectMock).toHaveBeenCalledWith('status, proposed_fee');
    expect(stats.total).toBe(4);
    expect(stats.byStatus.proposed).toBe(1);
    expect(stats.byStatus.accepted).toBe(2);
    expect(stats.byStatus.declined).toBe(1);
    expect(stats.totalValue).toBe(375);
    expect(stats.acceptedValue).toBe(325);
  });

  it('throws when Supabase returns an error', async () => {
    const failure = new Error('boom');
    dealSelectMock.mockResolvedValue({
      data: null,
      error: failure,
    });

    await expect(dealService.getStats()).rejects.toThrow(failure);
  });
});
