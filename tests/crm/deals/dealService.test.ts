const selectMock = jest.fn();
const fromMock = jest.fn(() => ({
  select: selectMock,
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('dealService.getStats', () => {
  // Import lazily after mocks so the service captures the mocked client
  const { dealService } = require('@/services/crm/deal-service');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates counts and monetary totals by status', async () => {
    selectMock.mockResolvedValue({
      data: [
        { status: 'proposed', proposed_fee: 50 },
        { status: 'accepted', proposed_fee: 125 },
        { status: 'accepted', proposed_fee: 200 },
        { status: 'declined', proposed_fee: null },
      ],
      error: null,
    });

    const stats = await dealService.getStats();

    expect(fromMock).toHaveBeenCalledWith('deal_negotiations');
    expect(selectMock).toHaveBeenCalledWith('status, proposed_fee');
    expect(stats.total).toBe(4);
    expect(stats.byStatus.proposed).toBe(1);
    expect(stats.byStatus.accepted).toBe(2);
    expect(stats.byStatus.declined).toBe(1);
    expect(stats.totalValue).toBe(375);
    expect(stats.acceptedValue).toBe(325);
  });

  it('throws when Supabase returns an error', async () => {
    const failure = new Error('boom');
    selectMock.mockResolvedValue({
      data: null,
      error: failure,
    });

    await expect(dealService.getStats()).rejects.toThrow(failure);
  });
});
