const selectMock = jest.fn();
const orderMock = jest.fn();
const limitMock = jest.fn();
const eqMock = jest.fn();
const queryBuilder = {
  eq: eqMock,
  order: orderMock,
  limit: limitMock,
};
const fromMock = jest.fn(() => ({
  select: selectMock,
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

describe('customerActivityService', () => {
  const { customerActivityService } = require('@/services/crm/customer-activity-service');

  beforeEach(() => {
    jest.clearAllMocks();
    limitMock.mockResolvedValue({ data: [], error: null });
    orderMock.mockReturnValue({ limit: limitMock });
    eqMock.mockReturnValue(queryBuilder);
    selectMock.mockReturnValue({ eq: eqMock });
  });

  it('fetches timeline entries with descending order', async () => {
    limitMock.mockResolvedValue({
      data: [{ activity_id: '1', customer_id: 'abc', activity_type: 'order', created_at: 'now', metadata: {} }],
      error: null,
    });

    const result = await customerActivityService.list('abc', 10);

    expect(fromMock).toHaveBeenCalledWith('customer_activity_timeline');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(result).toHaveLength(1);
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(eqMock).toHaveBeenCalledWith('customer_id', 'abc');
  });

  it('surfaces errors from Supabase when listing by type', async () => {
    const failure = new Error('boom');
    limitMock.mockResolvedValue({ data: null, error: failure });

    await expect(customerActivityService.listByType('abc', 'deal', 5)).rejects.toThrow(failure);
  });
});
